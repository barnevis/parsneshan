/**
 * @import {HtmlExtension} from 'micromark-util-types'
 */

/**
 * HTML extension of `alert`.
 *
 * @returns {HtmlExtension}
 *   HTML extension.
 */
export function alertHtml() {
  return {
    enter: {
      parsneshanAlert() {
        this.tag('<div class="parsneshan-alert">')
      }
    },
    exit: {
      parsneshanAlert() {
        this.tag('</div>')
      }
    }
  }
}
