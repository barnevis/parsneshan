import {createAdmonition} from '../shared/admonition.js'

const admonition = createAdmonition({
  className: 'parsneshan-tip',
  label: 'راهنما',
  typeName: 'parsneshanTip'
})

/**
 * Syntax extension of `tip`.
 *
 * @returns {import('micromark-util-types').Extension}
 *   Syntax extension.
 */
export function tip() {
  return admonition.syntax()
}

/**
 * HTML extension of `tip`.
 *
 * @returns {import('micromark-util-types').HtmlExtension}
 *   HTML extension.
 */
export function tipHtml() {
  return admonition.html()
}