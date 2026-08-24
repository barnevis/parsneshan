/**
 * @import {HtmlExtension} from 'micromark-util-types'
 */

/**
 * HTML extension of `warning`.
 *
 * @returns {HtmlExtension}
 *   HTML extension.
 */
export function warningHtml() {
  return {
    enter: {
      parsneshanWarning() {
        this.tag('<div class="parsneshan-warning">')
      }
    },
    exit: {
      parsneshanWarning() {
        this.tag('</div>')
      }
    }
  }
}
