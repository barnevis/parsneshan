import {test} from 'node:test'
import assert from 'node:assert/strict'
import {PERSIAN_FOOTNOTE_LABEL, persianFootnoteBackLabel, persianFootnoteOptions} from '../extensions/persian-footnote/index.js'

test('persian footnote label', () => {
  assert.equal(PERSIAN_FOOTNOTE_LABEL, 'پاورقی')
  assert.equal(persianFootnoteOptions.label, 'پاورقی')
})

test('persian footnote back label', () => {
  assert.equal(persianFootnoteBackLabel(0, 0), 'بازگشت به ارجاع 1')
  assert.equal(persianFootnoteBackLabel(2, 0), 'بازگشت به ارجاع 3')
  assert.equal(persianFootnoteBackLabel(0, 3), 'بازگشت به ارجاع 1-3')
})

test('persian footnote options shape', () => {
  assert.equal(typeof persianFootnoteOptions.backLabel, 'function')
  assert.equal(persianFootnoteOptions.backLabel(1, 1), 'بازگشت به ارجاع 2')
})
