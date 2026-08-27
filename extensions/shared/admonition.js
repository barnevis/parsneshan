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
 * @typedef Options
 *   Configuration of an admonition-like block.
 * @property {string} typeName
 *   Token type of the block (for example `'parsneshanWarning'`).
 * @property {string} label
 *   Exact word that identifies the block (for example `هشدار`).
 * @property {string} className
 *   Class of the `<div>` emitted by the HTML extension.
 */

import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding, markdownSpace} from 'micromark-util-character'
import {codes, constants, types} from 'micromark-util-symbol'

/**
 * Create the syntax and HTML extensions of an admonition-like block:
 * a fenced container opened by `... <label>` and closed by `...`,
 * whose content is parsed as normal markdown.
 *
 * @param {Options} options
 *   Configuration.
 * @returns {{html: () => HtmlExtension, syntax: () => Extension}}
 *   Factories of the syntax and HTML extensions.
 */
export function createAdmonition({className, label, typeName}) {
  const labelCodes = [...label].map((d) => d.codePointAt(0))
  const fence = typeName + 'Fence'
  const fenceSequence = typeName + 'FenceSequence'
  const fenceWhitespace = typeName + 'FenceWhitespace'
  const content = typeName + 'Content'

  const closingFence = {tokenize: tokenizeClosingFence, partial: true}
  const nonLazyLine = {tokenize: tokenizeNonLazyLine, partial: true}

  /** @type {Construct} */
  const construct = {
    concrete: true,
    name: typeName,
    tokenize: tokenizeAdmonition
  }

  /**
   * Start of a block.
   *
   * ```markdown
   * > | ... هشدار
   *     ^
   *   | متن هشدار
   * > | ...
   *     ^
   * ```
   *
   * @this {TokenizeContext}
   *   Context.
   * @type {Tokenizer}
   */
  function tokenizeAdmonition(effects, ok, nok) {
    const self = this
    /** @type {import('micromark-util-types').Token | undefined} */
    let previous
    let dots = 0

    return start

    /**
     * Start of opening fence.
     *
     * ```markdown
     * > | ... هشدار
     *     ^
     * ```
     *
     * @type {State}
     */
    function start(code) {
      effects.enter(typeName)
      effects.enter(fence)
      effects.enter(fenceSequence)
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
      effects.exit(fenceSequence)

      if (markdownSpace(code)) {
        effects.enter(fenceWhitespace)
        return fenceWhitespaceStep(code)
      }

      return beforeLabel(code)
    }

    /** @type {State} */
    function fenceWhitespaceStep(code) {
      if (markdownSpace(code)) {
        effects.consume(code)
        return fenceWhitespaceStep
      }

      effects.exit(fenceWhitespace)
      return beforeLabel(code)
    }

    /** @type {State} */
    function beforeLabel(code) {
      if (code !== labelCodes[0]) return nok(code)
      effects.enter(typeName + 'Label')
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
     * > | ... هشدار
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

      effects.exit(typeName + 'Label')
      effects.exit(fence)

      if (code === codes.eof) return after(code)

      if (!markdownLineEnding(code)) return nok(code)

      if (self.interrupt) return ok(code)

      return effects.attempt(nonLazyLine, contentStart, after)(code)
    }

    /**
     * Before content.
     *
     * ```markdown
     *   | ... هشدار
     * > | متن هشدار
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

      effects.enter(content)
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
        return effects.check(nonLazyLine, nonLazyLineAfter, lineAfter)(code)
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
      effects.enter(content)
      return lineStart(code)
    }

    /** @type {State} */
    function afterContent(code) {
      effects.exit(content)
      return after(code)
    }

    /** @type {State} */
    function after(code) {
      effects.exit(typeName)
      return ok(code)
    }
  }

  /**
   * Closing fence of a block.
   *
   * ```markdown
   *   | متن هشدار
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
      effects.enter(fence)
      effects.enter(fenceSequence)
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
      effects.exit(fenceSequence)

      if (code === codes.dot) return nok(code)

      return closingAfter(code)
    }

    /** @type {State} */
    function closingAfter(code) {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects.exit(fence)
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

  /** @returns {Extension} Syntax extension. */
  function syntax() {
    return {flow: {[codes.dot]: [construct]}}
  }

  /** @returns {HtmlExtension} HTML extension. */
  function html() {
    return {
      enter: {
        [typeName]() {
          const tightStack = this.getData('tightStack')
          tightStack.push(false)
          this.tag('<div class="' + className + '">')
        }
      },
      exit: {
        [typeName]() {
          const tightStack = this.getData('tightStack')
          tightStack.pop()
          this.lineEndingIfNeeded()
          this.tag('</div>')
        }
      }
    }
  }

  return {html, syntax}
}
