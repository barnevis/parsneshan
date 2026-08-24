import {createAdmonition} from '../shared/admonition.js'

const admonition = createAdmonition({
  className: 'parsneshan-caution',
  label: 'احتیاط',
  typeName: 'parsneshanCaution'
})

/**
 * Syntax extension of `caution`.
 *
 * @returns {import('micromark-util-types').Extension}
 *   Syntax extension.
 */
export function caution() {
  return admonition.syntax()
}

/**
 * HTML extension of `caution`.
 *
 * @returns {import('micromark-util-types').HtmlExtension}
 *   HTML extension.
 */
export function cautionHtml() {
  return admonition.html()
}
