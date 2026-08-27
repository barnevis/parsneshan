/**
 * @import {
 *   Construct,
 *   Extension,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

import {ok as assert} from 'devlop'
import {factorySpace} from 'micromark-factory-space'
import {asciiDigit, markdownLineEnding, markdownSpace} from 'micromark-util-character'
import {codes, constants, types} from 'micromark-util-symbol'
import {blankLine} from 'micromark-core-commonmark'

// Persian digits: ۰۱۲۳۴۵۶۷۸۹ (U+06F0 to U+06F9)
const PERSIAN_DIGIT_START = 0x06F0
const PERSIAN_DIGIT_END = 0x06F9

function isPersianDigit(code) {
  return code >= 0x06F0 && code <= 0x06F9
}

function isAnyDigit(code) {
  return (code >= codes.digit0 && code <= codes.digit9) || (code >= 0x06F0 && code <= 0x06F9)
}

/**
 * Convert Persian digit to ASCII digit during tokenization
 * @param {number} code
 * @returns {number} ASCII digit code or -1 if not a digit
 */
function digitToAscii(code) {
  if (code >= codes.digit0 && code <= codes.digit9) {
    return code
  }
  if (code >= 0x06F0 && code <= 0x06F9) {
    return codes.digit0 + (code - 0x06F0)
  }
  return -1
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeIndent(effects, ok, nok) {
  const self = this
  assert(self.containerState, 'expected state')
  assert(typeof self.containerState.size === 'number', 'expected size')
  return factorySpace(
    effects,
    afterPrefix,
    types.listItemIndent,
    self.containerState.size + 1
  )

  /** @type {State} */
  function afterPrefix(code) {
    assert(self.containerState, 'expected state')
    const tail = self.events[self.events.length - 1]
    return tail &&
      tail[1].type === types.listItemIndent &&
      self.sliceSerialize(tail[1], true).length === self.containerState.size
      ? ok(code)
      : nok(code)
  }
}

/** @type {Construct} */
const indentConstruct = {partial: true, tokenize: tokenizeIndent}

/** @type {Construct} */
const listItemPrefixWhitespaceConstruct = {partial: true, tokenize: tokenizeListItemPrefixWhitespace}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeListItemPrefixWhitespace(effects, ok, nok) {
  const self = this
  return factorySpace(
    effects,
    afterPrefix,
    types.listItemPrefixWhitespace,
    constants.tabSize + 1
  )

  /** @type {State} */
  function afterPrefix(code) {
    const tail = self.events[self.events.length - 1]
    return !markdownSpace(code) &&
      tail &&
      tail[1].type === 'listItemPrefixWhitespace'
      ? ok(code)
      : nok(code)
  }
}

/** @type {Construct} */
const persianList = {
  continuation: {tokenize: tokenizePersianListContinuation},
  exit: tokenizePersianListEnd,
  name: 'list',
  tokenize: tokenizePersianListStart
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizePersianListStart(effects, ok, nok) {
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
    assert(self.containerState, 'expected state')
    const kind = self.containerState.type || types.listOrdered

    if (isAnyDigit(code)) {
      if (!self.containerState.type) {
        self.containerState.type = 'listOrdered'
        effects.enter('listOrdered', {_container: true})
      }

      if (!self.interrupt || isFirstDigit(code)) {
        effects.enter('listItemPrefix')
        effects.enter('listItemValue')
        return inside(code)
      }
    }

    return nok(code)
  }

  function isFirstDigit(code) {
    return code === codes.digit1 || (code >= 0x06F0 && code <= 0x06F9)
  }

  /** @type {State} */
  function inside(code) {
    assert(self.containerState, 'expected state')
    const asciiCode = digitToAscii(code)
    if (asciiCode !== -1 && ++size < constants.listItemValueSizeMax) {
      // Convert Persian digit to ASCII during tokenization
      effects.consume(asciiCode)
      return inside
    }

    if (
      (!self.interrupt || size < 2) &&
      (code === codes.dot || code === codes.rightParenthesis)
    ) {
      effects.exit('listItemValue')
      return atMarker(code)
    }

    return nok(code)
  }

  function digitToAscii(code) {
    if (code >= codes.digit0 && code <= codes.digit9) {
      return code
    }
    if (code >= 0x06F0 && code <= 0x06F9) {
      return codes.digit0 + (code - 0x06F0)
    }
    return -1
  }

  function isAnyDigit(code) {
    return (code >= codes.digit0 && code <= codes.digit9) || (code >= 0x06F0 && code <= 0x06F9)
  }

  /** @type {State} */
  function atMarker(code) {
    effects.enter('listItemMarker')
    effects.consume(code)
    effects.exit('listItemMarker')
    self.containerState.marker = self.containerState.marker || code
    return effects.check(
      blankLine,
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
    return endOfPrefix(code)
  }

  /** @type {State} */
  function otherPrefix(code) {
    if (markdownSpace(code)) {
      effects.enter('listItemPrefixWhitespace')
      effects.consume(code)
      effects.exit('listItemPrefixWhitespace')
      return endOfPrefix
    }
    return nok(code)
  }

  /** @type {State} */
  function endOfPrefix(code) {
    self.containerState.size =
      initialSize +
      self.sliceSerialize(effects.exit('listItemPrefix'), true).length
    return ok(code)
  }
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizePersianListContinuation(effects, ok, nok) {
  const self = this
  self.containerState._closeFlow = undefined
  return effects.check(blankLine, onBlank, notBlank)

  /** @type {State} */
  function onBlank(code) {
    assert(self.containerState, 'expected state')
    assert(typeof self.containerState.size === 'number', 'expected size')
    self.containerState.furtherBlankLines =
      self.containerState.furtherBlankLines ||
      self.containerState.initialBlankLine
    return factorySpace(
      effects,
      ok,
      types.listItemIndent,
      self.containerState.size + 1
    )(code)
  }

  /** @type {State} */
  function notBlank(code) {
    assert(self.containerState, 'expected state')
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
    assert(self.containerState, 'expected state')
    self.containerState._closeFlow = true
    self.interrupt = undefined
    return factorySpace(
      effects,
      effects.attempt(persianList, ok, nok),
      types.linePrefix,
      constants.tabSize
    )(code)
  }
}

/**
 * @this {TokenizeContext}
 * @type {Exiter}
 */
function tokenizePersianListEnd(effects) {
  effects.exit('listOrdered')
}

/**
 * Syntax extension for Persian ordered list
 * Registers for Persian digits (۰-۹) at document level
 * @returns {Extension}
 */
export function persianOrderedList() {
  return {
    document: {
      0x06F0: [persianList],
      0x06F1: [persianList],
      0x06F2: [persianList],
      0x06F3: [persianList],
      0x06F4: [persianList],
      0x06F5: [persianList],
      0x06F6: [persianList],
      0x06F7: [persianList],
      0x06F8: [persianList],
      0x06F9: [persianList]
    }
  }
}

/**
 * HTML extension with custom handler for Persian digits in ordered lists
 * @returns {import('micromark-util-types').HtmlExtension}
 */
export function persianOrderedListHtml() {
  // Helper to close list item
  function closeListItem(context) {
    if (context.getData('lastWasTag') && !context.getData('slurpAllLineEndings')) {
      context.lineEndingIfNeeded()
    }
    context.tag('</li>')
    context.setData('slurpAllLineEndings')
  }

  return {
    enter: {
      listItemValue(token) {
        // Convert Persian digits to ASCII before parsing
        const serialized = this.sliceSerialize(token)
        const asciiValue = serialized.replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 0x30))
        const value = Number.parseInt(asciiValue, 10)
        
        if (this.getData('expectFirstItem')) {
          if (value !== 1) {
            this.tag(' start="' + value + '"')
          }
        }
      },
      listItemMarker() {
        if (this.getData('expectFirstItem')) {
          this.tag('>')
        } else {
          // Close previous list item
          if (this.getData('lastWasTag') && !this.getData('slurpAllLineEndings')) {
            this.lineEndingIfNeeded()
          }
          this.tag('</li>')
          this.setData('slurpAllLineEndings')
        }
        this.lineEndingIfNeeded()
        this.tag('<li>')
        this.setData('expectFirstItem')
        this.setData('lastWasTag')
      }
    },
    exit: {
      listItem() {
        if (this.getData('lastWasTag') && !this.getData('slurpAllLineEndings')) {
          this.lineEndingIfNeeded()
        }
        this.tag('</li>')
        this.setData('slurpAllLineEndings')
      },
      listOrdered() {
        // Close the last list item before closing the list
        if (this.getData('lastWasTag') && !this.getData('slurpAllLineEndings')) {
          this.lineEndingIfNeeded()
        }
        this.tag('</li>')
        this.setData('slurpAllLineEndings')
        this.raw('\n')
        this.tag('</ol>')
      }
    }
  }
}