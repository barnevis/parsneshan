/**
 * @import {
 *   Code,
 *   Construct,
 *   Exiter,
 *   Extension,
 *   HtmlExtension,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/**
 * Ordered lists with Persian digits.
 *
 * ```markdown
 * ۱. الف
 * ۲. ب
 * ```
 *
 * Mirrors the core `list` construct of `micromark-core-commonmark`, except
 * that digits are Persian (`۰` through `۹`, U+06F0 through U+06F9) instead of
 * ASCII. Arabic-Indic digits (U+0660 through U+0669) are *not* supported.
 *
 * The construct is registered in the `document` map for every Persian digit,
 * which merges with (does not replace) the core constructs, so ASCII lists,
 * unordered lists, and everything else keep working.
 */

import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding, markdownSpace} from 'micromark-util-character'
import {codes, constants, types} from 'micromark-util-symbol'

/** Persian digits, in order (`'۰'` through `'۹'`). */
const persianDigits = [...'۰۱۲۳۴۵۶۷۸۹']

/**
 * Map from the code point of a Persian digit to its value (`0` through `9`).
 *
 * @type {Record<number, number>}
 */
const persianDigitValue = {}
{
  let value = -1
  for (const digit of persianDigits) {
    persianDigitValue[digit.codePointAt(0)] = ++value
  }
}

/**
 * Check whether `code` is a Persian digit (`۰` through `۹`).
 *
 * @param {Code} code
 *   Code.
 * @returns {boolean}
 *   Whether `code` is a Persian digit.
 */
function persianDigit(code) {
  return code !== null && code in persianDigitValue
}

/**
 * Parse a string of Persian digits into a number.
 *
 * @param {string} value
 *   Value, such as `'۱۲۳'`.
 * @returns {number}
 *   Number, such as `123`.
 */
function parsePersianNumber(value) {
  let result = 0
  for (const character of value) {
    result = result * 10 + persianDigitValue[character.codePointAt(0)]
  }

  return result
}

/** Code points that `codes` does not define. */
const codesPersian = {
  digit1: 0x06f1
}

/** @type {Construct} */
export const persianList = {
  continuation: {tokenize: tokenizeListContinuation},
  exit: tokenizeListEnd,
  name: 'parsneshanPersianList',
  tokenize: tokenizeListStart
}

/** @type {Construct} */
const listItemPrefixWhitespaceConstruct = {
  partial: true,
  tokenize: tokenizeListItemPrefixWhitespace
}

/** @type {Construct} */
const indentConstruct = {partial: true, tokenize: tokenizeIndent}

/**
 * Blank line.
 *
 * The same as the core `blankLine` construct, defined locally so that this
 * extension only depends on packages already used by this project.
 *
 * @type {Construct}
 */
const blankLineConstruct = {partial: true, tokenize: tokenizeBlankLine}

/**
 * Start of a Persian ordered list.
 *
 * ```markdown
 * > | ۱. الف
 *     ^
 * > | ۲. ب
 *     ^
 * ```
 *
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeListStart(effects, ok, nok) {
  const self = this
  const tail = self.events[self.events.length - 1]
  let initialSize =
    tail && tail[1].type === types.linePrefix
      ? tail[2].sliceSerialize(tail[1], true).length
      : 0
  let size = 0

  return start

  /** @type {State} */
  function start(code) {
    const kind = self.containerState.type || types.listOrdered

    // Unlike the core `list`, this construct is always ordered: it is only
    // ever registered under Persian digits and only continued by itself.
    if (kind === types.listOrdered && persianDigit(code)) {
      if (!self.containerState.type) {
        self.containerState.type = kind
        effects.enter(kind, {_container: true})
      }

      // Only `۱.` (like the core rule for `1.`) can interrupt a paragraph.
      if (!self.interrupt || code === codesPersian.digit1) {
        effects.enter(types.listItemPrefix)
        effects.enter(types.listItemValue)
        return inside(code)
      }
    }

    return nok(code)
  }

  /** @type {State} */
  function inside(code) {
    if (persianDigit(code) && ++size < constants.listItemValueSizeMax) {
      effects.consume(code)
      return inside
    }

    if (
      (!self.interrupt || size < 2) &&
      (self.containerState.marker
        ? code === self.containerState.marker
        : code === codes.rightParenthesis || code === codes.dot)
    ) {
      effects.exit(types.listItemValue)
      return atMarker(code)
    }

    return nok(code)
  }

  /**
   * @type {State}
   **/
  function atMarker(code) {
    effects.enter(types.listItemMarker)
    effects.consume(code)
    effects.exit(types.listItemMarker)
    self.containerState.marker = self.containerState.marker || code
    return effects.check(
      blankLineConstruct,
      // Can’t be empty when interrupting.
      self.interrupt ? nok : onBlank,
      effects.attempt(
        listItemPrefixWhitespaceConstruct,
        endOfPrefix,
        otherPrefix
      )
    )
  }

  /** @type {State} */
  function onBlank(code) {
    self.containerState.initialBlankLine = true
    initialSize++
    return endOfPrefix(code)
  }

  /** @type {State} */
  function otherPrefix(code) {
    if (markdownSpace(code)) {
      effects.enter(types.listItemPrefixWhitespace)
      effects.consume(code)
      effects.exit(types.listItemPrefixWhitespace)
      return endOfPrefix
    }

    return nok(code)
  }

  /** @type {State} */
  function endOfPrefix(code) {
    self.containerState.size =
      initialSize +
      self.sliceSerialize(effects.exit(types.listItemPrefix), true).length
    return ok(code)
  }
}

/**
 * Continuation of a Persian ordered list.
 *
 * ```markdown
 *   | ۱. الف
 * > | ۲. ب
 *     ^
 * ```
 *
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeListContinuation(effects, ok, nok) {
  const self = this

  self.containerState._closeFlow = undefined

  return effects.check(blankLineConstruct, onBlank, notBlank)

  /** @type {State} */
  function onBlank(code) {
    self.containerState.furtherBlankLines =
      self.containerState.furtherBlankLines ||
      self.containerState.initialBlankLine

    // We have a blank line.
    // Still, try to consume at most the items size.
    return factorySpace(
      effects,
      ok,
      types.listItemIndent,
      self.containerState.size + 1
    )(code)
  }

  /** @type {State} */
  function notBlank(code) {
    if (self.containerState.furtherBlankLines || !markdownSpace(code)) {
      self.containerState.furtherBlankLines = undefined
      self.containerState.initialBlankLine = undefined
      return notInCurrentItem(code)
    }

    self.containerState.furtherBlankLines = undefined
    self.containerState.initialBlankLine = undefined
    return effects.attempt(indentConstruct, ok, notInCurrentItem)(code)
  }

  /** @type {State} */
  function notInCurrentItem(code) {
    // While we do continue, we signal that the flow should be closed.
    self.containerState._closeFlow = true
    // As we’re closing flow, we’re no longer interrupting.
    self.interrupt = undefined
    return factorySpace(
      effects,
      // Note: the core `list` attempts itself here (through a closure over
      // the construct). A Persian list item can only be followed by another
      // Persian list item, so this attempts `persianList` instead.
      effects.attempt(persianList, ok, nok),
      types.linePrefix,
      self.parser.constructs.disable.null.includes('codeIndented')
        ? undefined
        : constants.tabSize
    )(code)
  }
}

/**
 * Indent continuation of a Persian ordered list item.
 *
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeIndent(effects, ok, nok) {
  const self = this

  return factorySpace(
    effects,
    afterPrefix,
    types.listItemIndent,
    self.containerState.size + 1
  )

  /** @type {State} */
  function afterPrefix(code) {
    const tail = self.events[self.events.length - 1]
    return tail &&
      tail[1].type === types.listItemIndent &&
      tail[2].sliceSerialize(tail[1], true).length === self.containerState.size
      ? ok(code)
      : nok(code)
  }
}

/**
 * End of a Persian ordered list.
 *
 * @this {TokenizeContext}
 *   Context.
 * @type {Exiter}
 */
function tokenizeListEnd(effects) {
  effects.exit(this.containerState.type)
}

/**
 * Whitespace after a Persian list item marker.
 *
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeListItemPrefixWhitespace(effects, ok, nok) {
  const self = this

  return factorySpace(
    effects,
    afterPrefix,
    types.listItemPrefixWhitespace,
    self.parser.constructs.disable.null.includes('codeIndented')
      ? undefined
      : constants.tabSize + 1
  )

  /** @type {State} */
  function afterPrefix(code) {
    const tail = self.events[self.events.length - 1]

    return !markdownSpace(code) &&
      tail &&
      tail[1].type === types.listItemPrefixWhitespace
      ? ok(code)
      : nok(code)
  }
}

/**
 * Blank line.
 *
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeBlankLine(effects, ok, nok) {
  return factorySpace(effects, after, types.linePrefix)

  /** @type {State} */
  function after(code) {
    return code === codes.eof || markdownLineEnding(code) ? ok(code) : nok(code)
  }
}

/**
 * Syntax extension of `persianList`.
 *
 * Registers the construct for each Persian digit (`۰` through `۹`), so that a
 * new list can start with any Persian digit (`۲.` starts a list at 2),
 * mirroring how the core `list` is registered for `0` through `9`.
 *
 * @returns {Extension}
 *   Syntax extension.
 */
export function persianListExtension() {
  /** @type {Extension['document']} */
  const document = {}

  for (const digit of persianDigits) {
    document[digit.codePointAt(0)] = [persianList]
  }

  return {document}
}

/**
 * HTML extension of `persianList`.
 *
 * The default compiler emits `<ol>`/`<li>` and handles tight/loose lists
 * based on the standard list tokens, which this extension emits. The only
 * missing piece is the `start` attribute: the default `listItemValue`
 * handler uses `Number.parseInt`, which does not understand Persian digits.
 * This extension replaces that single handler. Because it replaces it for
 * *all* lists, it also handles ASCII digits.
 *
 * @returns {HtmlExtension}
 *   HTML extension.
 */
export function persianListHtml() {
  return {
    enter: {
      listItemValue(token) {
        if (this.getData('expectFirstItem')) {
          const value = this.sliceSerialize(token)
          const number = /^-?[0-9]+$/.test(value)
            ? Number.parseInt(value, constants.numericBaseDecimal)
            : parsePersianNumber(value)

          if (number !== 1) {
            this.tag(' start="' + number + '"')
          }
        }
      }
    }
  }
}
