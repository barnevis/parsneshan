import {createAdmonition} from '../shared/admonition.js'

const admonition = createAdmonition({
  className: 'parsneshan-note',
  label: 'نکته',
  typeName: 'parsneshanNote'
})

/**
 * Syntax extension of `note`.
 *
 * @returns {import('micromark-util-types').Extension}
 *   Syntax extension.
 */
export function note() {
  return admonition.syntax()
}

/**
 * HTML extension of `note`.
 *
 * @returns {import('micromark-util-types').HtmlExtension}
 *   HTML extension.
 */
export function noteHtml() {
  return admonition.html()
}