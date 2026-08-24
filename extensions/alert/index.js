import {createAdmonition} from '../shared/admonition.js'

const admonition = createAdmonition({
  className: 'parsneshan-alert',
  label: 'اخطار',
  typeName: 'parsneshanAlert'
})

/**
 * Syntax extension of `alert`.
 *
 * @returns {import('micromark-util-types').Extension}
 *   Syntax extension.
 */
export function alert() {
  return admonition.syntax()
}

/**
 * HTML extension of `alert`.
 *
 * @returns {import('micromark-util-types').HtmlExtension}
 *   HTML extension.
 */
export function alertHtml() {
  return admonition.html()
}
