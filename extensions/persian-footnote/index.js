/**
 * Persian rendering options for GFM footnotes.
 *
 * Footnote *syntax* (`[^1]` … `[^1]: …`) belongs to GFM, so parsneshan adds
 * no syntax here — only the Persian UI strings used when serializing to HTML.
 * Pass the result to the `gfmHtml()` options of `micromark-extension-gfm`
 * (it forwards `label`/`backLabel` to its footnote renderer).
 *
 * @typedef {{ label: string, backLabel: (referenceIndex: number, rereferenceIndex: number) => string }} PersianFootnoteOptions
 */

/** Persian footnote section heading (replaces GFM's "Footnotes"). */
export const PERSIAN_FOOTNOTE_LABEL = 'پاورقی'

/**
 * Persian back-reference label, mirroring GFM's `defaultBackLabel` shape.
 *
 * @param {number} referenceIndex — definition index, 0-based
 * @param {number} rereferenceIndex — repeat-call index, 0-based
 * @returns {string} accessible label
 */
export function persianFootnoteBackLabel(referenceIndex, rereferenceIndex) {
  return `بازگشت به ارجاع ${referenceIndex + 1}${rereferenceIndex > 1 ? `-${rereferenceIndex}` : ''}`
}

/** @type {PersianFootnoteOptions} */
export const persianFootnoteOptions = {
  label: PERSIAN_FOOTNOTE_LABEL,
  backLabel: persianFootnoteBackLabel
}
