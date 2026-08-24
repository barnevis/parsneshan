import {createAdmonition} from '../shared/admonition.js'

const admonition = createAdmonition({
  className: 'parsneshan-warning',
  label: 'هشدار',
  typeName: 'parsneshanWarning'
})

/**
 * Syntax extension of `warning`.
 *
 * @returns {import('micromark-util-types').Extension}
 *   Syntax extension.
 */
export function warning() {
  return admonition.syntax()
}

/**
 * HTML extension of `warning`.
 *
 * @returns {import('micromark-util-types').HtmlExtension}
 *   HTML extension.
 */
export function warningHtml() {
  return admonition.html()
}
