/**
 * @import {
 *   Construct,
 *   Extension,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding, markdownSpace} from 'micromark-util-character'
import {codes, constants, types} from 'micromark-util-symbol'

/** Code points of the word `اخطار`. */
const labelCodes = [0x0627, 0x062e, 0x0637, 0x0627, 0x0631]

const closingFence = {tokenize: tokenizeClosingFence, partial: true}
const nonLazyLine = {tokenize: tokenizeNonLazyLine, partial: true}

/** @type {Construct} */
const alertConstruct = {
  concrete: true,
  name: 'parsneshanAlert',
  tokenize: tokenizeAlert
}

/**
 * Start of an alert block.
 *
 * ```markdown
 * > | ... اخطار
 *     ^
 *   | متن اخطار
 * > | ...
 *     ^
 * ```
 *
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeAlert(effects, ok, nok) {
  const self = this
  /** @type {import('micromark-util-types').Token | undefined} */
  let previous
  let dots = 0

  return start

  /**
   * Start of opening fence.
   *
   * ```markdown
   * > | ... اخطار
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter('parsneshanAlert')
    effects.enter('parsneshanAlertFence')
    effects.enter('parsneshanAlertFenceSequence')
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

  /** @type {State} */
  function afterFenceSequence(code) {
    effects.exit('parsneshanAlertFenceSequence')

    if (markdownSpace(code)) {
      effects.enter('parsneshanAlertFenceWhitespace')
      return fenceWhitespace(code)
    }

    return beforeLabel(code)
  }

  /** @type {State} */
  function fenceWhitespace(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return fenceWhitespace
    }

    effects.exit('parsneshanAlertFenceWhitespace')
    return beforeLabel(code)
  }

  /** @type {State} */
  function beforeLabel(code) {
    if (code !== labelCodes[0]) return nok(code)
    effects.enter('parsneshanAlertLabel')
    effects.consume(code)
    return label(1)
  }

  /**
   * @param {number} index
   *   Index in `labelCodes`.
   * @returns {State}
   *   State.
   */
  function label(index) {
    return function (code) {
      if (code !== labelCodes[index]) return nok(code)
      effects.consume(code)
      return index < labelCodes.length - 1 ? label(index + 1) : afterLabel
    }
  }

  /**
   * After the label, before the end of the opening line.
   *
   * ```markdown
   * > | ... اخطار
   *               ^
   * ```
   *
   * @type {State}
   */
  function afterLabel(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return afterLabel
    }

    effects.exit('parsneshanAlertLabel')
    effects.exit('parsneshanAlertFence')

    if (code === codes.eof) return after(code)

    if (!markdownLineEnding(code)) return nok(code)

    if (self.interrupt) return ok(code)

    return effects.attempt(nonLazyLine, contentStart, after)(code)
  }

  /**
   * Before content.
   *
   * ```markdown
   *   | ... اخطار
   * > | متن اخطار
   *     ^
   * ```
   *
   * @type {State}
   */
  function contentStart(code) {
    if (code === codes.eof) return afterContent(code)

    if (markdownLineEnding(code)) {
      return effects.check(
        nonLazyLine,
        emptyContentNonLazyLineAfter,
        after
      )(code)
    }

    effects.enter('parsneshanAlertContent')
    return lineStart(code)
  }

  /**
   * At start of a content line, first try whether it’s the closing fence.
   *
   * @type {State}
   */
  function lineStart(code) {
    return effects.attempt(closingFence, afterContent, chunkStart)(code)
  }

  /** @type {State} */
  function chunkStart(code) {
    if (code === codes.eof) return afterContent(code)

    if (markdownLineEnding(code)) {
      return effects.check(nonLazyLine, chunkNonLazyStart, afterContent)(code)
    }

    return chunkNonLazyStart(code)
  }

  /** @type {State} */
  function chunkNonLazyStart(code) {
    const token = effects.enter(types.chunkDocument, {
      contentType: constants.contentTypeDocument,
      previous
    })
    if (previous) previous.next = token
    previous = token
    return contentContinue(code)
  }

  /** @type {State} */
  function contentContinue(code) {
    if (code === codes.eof) {
      const token = effects.exit(types.chunkDocument)
      self.parser.lazy[token.start.line] = false
      return afterContent(code)
    }

    if (markdownLineEnding(code)) {
      return effects.check(
        nonLazyLine,
        nonLazyLineAfter,
        lineAfter
      )(code)
    }

    effects.consume(code)
    return contentContinue
  }

  /** @type {State} */
  function nonLazyLineAfter(code) {
    effects.consume(code)
    const token = effects.exit(types.chunkDocument)
    self.parser.lazy[token.start.line] = false
    return lineStart
  }

  /** @type {State} */
  function lineAfter(code) {
    const token = effects.exit(types.chunkDocument)
    self.parser.lazy[token.start.line] = false
    return afterContent(code)
  }

  /** @type {State} */
  function emptyContentNonLazyLineAfter(code) {
    effects.enter('parsneshanAlertContent')
    return lineStart(code)
  }

  /** @type {State} */
  function afterContent(code) {
    effects.exit('parsneshanAlertContent')
    return after(code)
  }

  /** @type {State} */
  function after(code) {
    effects.exit('parsneshanAlert')
    return ok(code)
  }
}

/**
 * Closing fence of an alert block.
 *
 * ```markdown
 *   | متن اخطار
 * > | ...
 *     ^
 * ```
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
    effects.enter('parsneshanAlertFence')
    effects.enter('parsneshanAlertFenceSequence')
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
    effects.exit('parsneshanAlertFenceSequence')

    if (code === codes.dot) return nok(code)

    return closingAfter(code)
  }

  /** @type {State} */
  function closingAfter(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit('parsneshanAlertFence')
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
 * Syntax extension of `alert`.
 *
 * @returns {Extension}
 *   Syntax extension.
 */
export function alert() {
  return {flow: {[codes.dot]: [alertConstruct]}}
}
