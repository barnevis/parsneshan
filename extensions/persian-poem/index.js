/**
 * @import {
 *   Construct,
 *   Extension,
 *   HtmlExtension,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/**
 * Persian poem block.
 *
 * ```markdown
 * ...شعر
 * تو نیکی می‌کن و در دجله انداز     که ایزد در بیابانت دهد باز
 *
 * به جهان خرم از آنم که جهان خرم از اوست     عاشقم بر همه عالم که همه عالم از اوست
 * ...
 * ```
 *
 * A standalone micro-parser: lines inside the block are parsed directly into
 * verses (بیت) and hemistichs (مصرع) and are *not* re-parsed as Markdown.
 *
 * Each verse is either:
 *
 * * one line: two hemistichs separated by at least five plain spaces
 *   (U+0020), or
 * * two consecutive lines: one hemistich per line.
 *
 * A blank line between verses is mandatory (extra blank lines are allowed).
 * Mixing the two verse forms in one block, an incomplete verse, or a non-blank
 * line right after a complete verse invalidates the whole block, which then
 * falls back to normal Markdown.
 */

import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding, markdownSpace} from 'micromark-util-character'
import {codes, constants, types} from 'micromark-util-symbol'

/** Code points of the opening fence label: `شعر`. */
const labelCodes = [...'شعر'].map((character) => character.codePointAt(0))

/** Minimum plain spaces (U+0020) separating hemistichs on a one-line verse. */
const hemistichSeparatorMin = 5

// Token types.
const poemType = 'parsneshanPoem'
const fenceType = 'parsneshanPoemFence'
const fenceSequenceType = 'parsneshanPoemFenceSequence'
const labelType = 'parsneshanPoemLabel'
const verseType = 'parsneshanPoemVerse'
const hemistichType = 'parsneshanPoemHemistich'

/** @type {Construct} */
const poem = {concrete: true, name: 'parsneshanPoem', tokenize: tokenizePoem}

/** Closing fence: `...` with optional trailing spaces. */
const closingFence = {partial: true, tokenize: tokenizeClosingFence}

/** A line ending that is not a lazy continuation line. */
const nonLazyLine = {partial: true, tokenize: tokenizeNonLazyLine}

/**
 * Start of a poem block.
 *
 * ```markdown
 * > | ...شعر
 *     ^
 * ```
 *
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizePoem(effects, ok, nok) {
  const self = this
  let dots = 0
  let labelIndex = 0

  // Which verse form the block uses: `'one-line'` or `'two-line'`. Mixing the
  // two invalidates the block.
  /** @type {'one-line' | 'two-line' | undefined} */
  let verseForm

  // How many hemistichs the current verse has so far (1 or 2 when complete).
  let hemistichsInVerse = 0

  // Whether a verse token is currently open.
  let verseOpen = false

  // Number of consecutive plain spaces inside the current hemistich.
  let spaces = 0

  return start

  /** @type {State} */
  function start(code) {
    effects.enter(poemType)
    effects.enter(fenceType)
    effects.enter(fenceSequenceType)
    return fenceSequence(code)
  }

  /** @type {State} */
  function fenceSequence(code) {
    if (code === codes.dot) {
      effects.consume(code)
      dots++
      return dots < 3 ? fenceSequence : afterFenceSequence
    }

    return nok(code)
  }

  /**
   * After `...`, directly at `شعر` — no whitespace is allowed in between.
   *
   * ```markdown
   * > | ...شعر
   *        ^
   * ```
   *
   * @type {State}
   */
  function afterFenceSequence(code) {
    effects.exit(fenceSequenceType)

    // Note: unlike the admonition blocks, whitespace between `...` and the
    // label is *not* allowed: `... شعر` does not open a poem.
    if (code !== labelCodes[0]) return nok(code)

    effects.enter(labelType)
    effects.consume(code)
    labelIndex = 1
    return label
  }

  /** @type {State} */
  function label(code) {
    if (labelIndex < labelCodes.length) {
      if (code !== labelCodes[labelIndex]) return nok(code)
      effects.consume(code)
      labelIndex++
      return label
    }

    effects.exit(labelType)

    // Optional trailing spaces on the opening line.
    if (markdownSpace(code)) {
      return factorySpace(effects, afterLabel, types.whitespace)(code)
    }

    return afterLabel(code)
  }

  /**
   * After the label, at the end of the opening line.
   *
   * ```markdown
   * > | ...شعر
   *            ^
   * ```
   *
   * @type {State}
   */
  function afterLabel(code) {
    effects.exit(fenceType)

    if (code === codes.eof) {
      // End of file right after the opening fence: the block is empty.
      return after(code)
    }

    if (!markdownLineEnding(code)) return nok(code)

    if (self.interrupt) return ok(code)

    return effects.attempt(nonLazyLine, contentStart, after)(code)
  }

  /**
   * Start of content: try the closing fence (an empty poem), then lines.
   *
   * ```markdown
   * > | ...شعر
   * > | ...
   *     ^
   * ```
   *
   * @type {State}
   */
  function contentStart(code) {
    return effects.attempt(closingFence, after, lineStart)(code)
  }

  /**
   * At the start of a content line: the closing fence, a blank line, or a
   * hemistich.
   *
   * @type {State}
   */
  function lineStart(code) {
    if (code === codes.eof) return after(code)

    if (markdownLineEnding(code)) {
      // A blank line: the separator between verses. Extra blank lines are
      // allowed.
      return effects.check(nonLazyLine, blankContinue, after)(code)
    }

    return effects.attempt(closingFence, after, hemistichStart)(code)
  }

  /**
   * A blank line is next: consume it and any further blank lines.
   *
   * @type {State}
   */
  function blankContinue(code) {
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return blankExtra
  }

  /**
   * After a mandatory blank line: skip further blank lines.
   *
   * @type {State}
   */
  function blankExtra(code) {
    if (code === codes.eof) return after(code)

    if (markdownLineEnding(code)) {
      return effects.check(nonLazyLine, blankExtraLine, after)(code)
    }

    return lineStart(code)
  }

  /** @type {State} */
  function blankExtraLine(code) {
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return blankExtra
  }

  /**
   * Start of a hemistich line: a non-blank line.
   *
   * ```markdown
   * > | تو نیکی می‌کن و در دجله انداز
   *     ^
   * ```
   *
   * @type {State}
   */
  function hemistichStart(code) {
    // A new verse begins when the previous one is complete (or at the very
    // start of the block).
    if (hemistichsInVerse === 0) {
      effects.enter(verseType)
      verseOpen = true
    }

    hemistichsInVerse++
    spaces = 0
    effects.enter(hemistichType)
    return hemistichContinue(code)
  }

  /**
   * Inside a hemistich.
   *
   * @type {State}
   */
  function hemistichContinue(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return hemistichEnd(code)
    }

    if (code === codes.space) {
      spaces++
      effects.consume(code)
      return hemistichContinue
    }

    if (spaces >= hemistichSeparatorMin) {
      // Five or more spaces followed by text: a one-line verse. Split off the
      // second hemistich here.
      if (verseForm === 'two-line') return nok(code)

      // A second separator means three hemistichs on one line: invalid, no
      // matter what form the block is in.
      if (hemistichsInVerse > 1) return nok(code)

      verseForm = 'one-line'
      effects.exit(hemistichType)
      hemistichsInVerse++
      spaces = 0
      effects.enter(hemistichType)
    } else {
      spaces = 0
    }

    effects.consume(code)
    return hemistichContinue
  }

  /**
   * At the end of a hemistich line.
   *
   * @type {State}
   */
  function hemistichEnd(code) {
    // If this is the first hemistich of a verse and no separator was seen
    // yet, the block is (still) in the two-line form.
    if (hemistichsInVerse % 2 === 1 && verseForm === undefined) {
      verseForm = 'two-line'
    }

    // In the one-line form, a verse is always complete on its single line:
    // a second hemistich line can never follow.
    if (verseForm === 'one-line' && hemistichsInVerse % 2 === 1) {
      return nok(code)
    }

    effects.exit(hemistichType)

    if (hemistichsInVerse % 2 === 1) {
      // A single hemistich so far: the second hemistich of this verse must
      // follow directly (no blank line, closing fence, or eof in between —
      // that would make the verse incomplete and invalidate the block).
      if (!markdownLineEnding(code)) {
        // `eof` right after the first hemistich: incomplete verse.
        return nok(code)
      }

      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      // Only a hemistich line may follow; anything else fails.
      return expectingSecond
    }

    // The verse is complete: close it, then require a blank line, the
    // closing fence, or eof.
    effects.exit(verseType)
    verseOpen = false
    hemistichsInVerse = 0

    if (code === codes.eof) return afterVerse(code)

    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return afterVerse
  }

  /**
   * Expecting the second hemistich of a two-line verse: the next line must be
   * a non-blank hemistich (not the closing fence, not eof, not a blank line).
   *
   * @type {State}
   */
  function expectingSecond(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      // A blank line or eof right after the first hemistich: incomplete
      // verse.
      return nok(code)
    }

    // The closing fence here means the verse never got its second hemistich:
    // the block is invalid.
    return effects.attempt(closingFence, nok, hemistichStart)(code)
  }

  /**
   * After a complete verse: a blank line, the closing fence, or eof.
   *
   * @type {State}
   */
  function afterVerse(code) {
    if (code === codes.eof) return after(code)

    if (markdownLineEnding(code)) {
      return effects.check(nonLazyLine, blankContinue, after)(code)
    }

    return effects.attempt(closingFence, after, nok)(code)
  }

  /**
   * After all content: close the poem.
   *
   * @type {State}
   */
  function after(code) {
    // Close any dangling verse (cannot be open here in practice, but be safe).
    if (verseOpen) {
      effects.exit(verseType)
      verseOpen = false
    }

    effects.exit(poemType)
    return ok(code)
  }
}

/**
 * Closing fence: `...` with optional trailing spaces.
 *
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeClosingFence(effects, ok, nok) {
  let dots = 0

  return factorySpace(
    effects,
    closingPrefixAfter,
    types.linePrefix,
    constants.tabSize
  )

  /** @type {State} */
  function closingPrefixAfter(code) {
    effects.enter(fenceType)
    effects.enter(fenceSequenceType)
    return closingSequence(code)
  }

  /** @type {State} */
  function closingSequence(code) {
    if (code !== codes.dot) return nok(code)
    effects.consume(code)
    dots++
    return dots < 3 ? closingSequence : afterSequence
  }

  /** @type {State} */
  function afterSequence(code) {
    effects.exit(fenceSequenceType)

    if (code === codes.dot) return nok(code)

    return closingAfter(code)
  }

  /** @type {State} */
  function closingAfter(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(fenceType)
      return ok(code)
    }

    if (markdownSpace(code)) {
      effects.consume(code)
      return closingAfter
    }

    return nok(code)
  }
}

/**
 * A line ending that is not a lazy continuation line.
 *
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeNonLazyLine(effects, ok, nok) {
  const self = this

  return start

  /** @type {State} */
  function start(code) {
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return lineStart
  }

  /** @type {State} */
  function lineStart(code) {
    return self.parser.lazy[self.now().line] ? nok(code) : ok(code)
  }
}

/**
 * Syntax extension of `persianPoem`.
 *
 * @returns {Extension}
 *   Syntax extension.
 */
export function persianPoem() {
  return {flow: {[codes.dot]: [poem]}}
}

/**
 * HTML extension of `persianPoem`.
 *
 * Each verse becomes a `<div class="parsneshan-verse">`, each hemistich a
 * `<span class="parsneshan-hemistich">`; the whole poem is wrapped in
 * `<div class="parsneshan-poem">`.
 *
 * @returns {HtmlExtension}
 *   HTML extension.
 */
export function persianPoemHtml() {
  return {
    enter: {
      [poemType]() {
        const tightStack = this.getData('tightStack')
        tightStack.push(false)
        this.setData('parsneshanPoem', true)
        this.lineEndingIfNeeded()
        this.tag('<div class="parsneshan-poem">')
      },
      [verseType]() {
        this.lineEndingIfNeeded()
        this.tag('<div class="parsneshan-verse">')
      },
      [hemistichType]() {
        this.tag('<span class="parsneshan-hemistich">')
      },
      // Line endings inside the poem (between hemistichs and verses) must not
      // show up in the output: both verse forms produce the same HTML.
      [types.lineEnding]() {
        if (this.getData('parsneshanPoem')) {
          this.setData('slurpOneLineEnding', true)
        }
      },
      [types.lineEndingBlank]() {
        if (this.getData('parsneshanPoem')) {
          this.setData('slurpOneLineEnding', true)
        }
      }
    },
    exit: {
      [poemType]() {
        this.setData('parsneshanPoem')
        this.lineEndingIfNeeded()
        this.tag('</div>')
        const tightStack = this.getData('tightStack')
        tightStack.pop()
      },
      [hemistichType](token) {
        // Emit the raw hemistich text (trailing spaces trimmed; leading
        // spaces after the separator are not part of the token in the
        // one-line form, and leading spaces of a line are included here, so
        // trim both).
        this.tag(this.encode(this.sliceSerialize(token).replace(/^ +| +$/g, '')))
        this.tag('</span>')
      },
      [verseType]() {
        this.tag('</div>')
      }
    }
  }
}
