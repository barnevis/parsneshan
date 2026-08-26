import {createAdmonition} from '../shared/admonition.js'

const admonition = createAdmonition({
  className: 'parsneshan-important',
  label: 'مهم',
  typeName: 'parsneshanImportant'
})

/**
 * Syntax extension of `important`.
 *
 * @returns {import('micromark-util-types').Extension}
 *   Syntax extension.
 */
export function important() {
  return admonition.syntax()
}

/**
 * HTML extension of `important`.
 *
 * @returns {import('micromark-util-types').HtmlExtension}
 *   HTML extension.
 */
export function importantHtml() {
  return admonition.html()
}