/**
 * @import {HtmlExtension} from 'micromark-util-types'
 */

/**
 * HTML extension of `caution`.
 *
 * @returns {HtmlExtension}
 *   HTML extension.
 */
export function cautionHtml() {
  return {
    enter: {
      parsneshanCaution() {
        this.tag('<div class="parsneshan-caution">')
      }
    },
    exit: {
      parsneshanCaution() {
        this.tag('</div>')
      }
    }
  }
}
