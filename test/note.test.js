import {test} from 'node:test'
import assert from 'node:assert/strict'
import {micromark} from 'micromark'
import {note, noteHtml} from '../extensions/note/index.js'
import {warning, warningHtml} from '../extensions/warning/index.js'
import {caution, cautionHtml} from '../extensions/caution/index.js'
import {important, importantHtml} from '../extensions/important/index.js'
import {tip, tipHtml} from '../extensions/tip/index.js'

/** @type {import('micromark-util-types').Options} */
const options = {
  extensions: [note()],
  htmlExtensions: [noteHtml()]
}

/** @param {string} value */
function render(value) {
  return micromark(value, options)
}

test('basic note block', () => {
  assert.equal(
    render('... نکته\nمتن نکته\n...\n'),
    '<div class="parsneshan-note">\n<p>متن نکته</p>\n</div>\n'
  )
})

test('multiline content', () => {
  assert.equal(
    render('... نکته\nخط اول\nخط دوم\n...\n'),
    '<div class="parsneshan-note">\n<p>خط اول\nخط دوم</p>\n</div>\n'
  )
})

test('inline markdown in content', () => {
  assert.equal(
    render('... نکته\nمتن *مهم* و «خاص»\n...\n'),
    '<div class="parsneshan-note">\n<p>متن <em>مهم</em> و «خاص»</p>\n</div>\n'
  )
})

test('multiple blocks of content', () => {
  assert.equal(
    render('... نکته\nالف\n\nب\n...\n'),
    '<div class="parsneshan-note">\n<p>الف</p>\n<p>ب</p>\n</div>\n'
  )
})

test('list in content', () => {
  assert.equal(
    render('... نکته\n- یک\n- دو\n...\n'),
    '<div class="parsneshan-note">\n<ul>\n<li>یک</li>\n<li>دو</li>\n</ul>\n</div>\n'
  )
})

test('content around note stays outside', () => {
  assert.equal(
    render('قبل\n\n... نکته\nداخل\n...\n\nبعد\n'),
    '<p>قبل</p>\n<div class="parsneshan-note">\n<p>داخل</p>\n</div>\n<p>بعد</p>\n'
  )
})

test('unclosed note extends to end of document', () => {
  assert.equal(
    render('... نکته\nمتن\n'),
    '<div class="parsneshan-note">\n<p>متن</p>\n</div>'
  )
})

test('extra text on opening line invalidates the block', () => {
  assert.equal(
    render('... نکته خانه\nمتن\n...\n'),
    '<p>... نکته خانه\nمتن\n...</p>\n'
  )
})

test('other admonition words do not create a note', () => {
  assert.equal(
    render('... هشدار\nمتن\n...\n'),
    '<p>... هشدار\nمتن\n...</p>\n'
  )
})

test('incomplete label does not create a note', () => {
  assert.equal(
    render('... نک\nمتن\n...\n'),
    '<p>... نک\nمتن\n...</p>\n'
  )
})

test('closing line with trailing text does not close the block', () => {
  assert.equal(
    render('... نکته\nمتن\n... اضافه\n'),
    '<div class="parsneshan-note">\n<p>متن\n... اضافه</p>\n</div>'
  )
})

test('opening line without space after dots works', () => {
  assert.equal(
    render('...نکته\nمتن\n...\n'),
    '<div class="parsneshan-note">\n<p>متن</p>\n</div>\n'
  )
})

test('no indentation works', () => {
  assert.equal(
    render('... نکته\nمتن\n...\n'),
    '<div class="parsneshan-note">\n<p>متن</p>\n</div>\n'
  )
})

test('one space of indentation is allowed', () => {
  assert.equal(
    render(' ... نکته\n متن\n ...\n'),
    '<div class="parsneshan-note">\n<p>متن</p>\n</div>\n'
  )
})

test('two spaces of indentation are allowed', () => {
  assert.equal(
    render('  ... نکته\n  متن\n  ...\n'),
    '<div class="parsneshan-note">\n<p>متن</p>\n</div>\n'
  )
})

test('three spaces of indentation are allowed', () => {
  assert.equal(
    render('   ... نکته\n   متن\n   ...\n'),
    '<div class="parsneshan-note">\n<p>متن</p>\n</div>\n'
  )
})

test('four spaces of indentation is indented code, not a note', () => {
  assert.equal(
    micromark('    ... نکته\nمتن\n...\n', options),
    '<pre><code>... نکته\n</code></pre>\n<p>متن\n...</p>\n'
  )
})

test('note interrupts a paragraph', () => {
  assert.equal(
    render('پاراگراف\n... نکته\nمتن\n...\n'),
    '<p>پاراگراف</p>\n<div class="parsneshan-note">\n<p>متن</p>\n</div>\n'
  )
})

test('note inside list item preserves paragraph (regression)', () => {
  assert.equal(
    render('- یک\n  ... نکته\n  متن\n  ...\n'),
    '<ul>\n<li>یک<div class="parsneshan-note">\n<p>متن</p>\n</div>\n</li>\n</ul>\n'
  )
})

test('note inside a block quote', () => {
  assert.equal(
    render('> ... نکته\n> متن\n> ...\n'),
    '<blockquote><div class="parsneshan-note">\n<p>متن</p>\n</div>\n</blockquote>\n'
  )
})

test('nested markdown structure inside content', () => {
  const input = [
    '... نکته',
    '## عنوان',
    '',
    'پاراگراف',
    '...'
  ].join('\n')
  assert.equal(
    render(input),
    '<div class="parsneshan-note">\n<h2>عنوان</h2>\n<p>پاراگراف</p>\n</div>'
  )
})

test('closing fence must be exactly three dots', () => {
  assert.equal(
    render('... نکته\nمتن\n....\n'),
    '<div class="parsneshan-note">\n<p>متن\n....</p>\n</div>'
  )
})

test('closing fence with fewer than three dots does not close the block', () => {
  assert.equal(
    render('... نکته\nمتن\n..\n'),
    '<div class="parsneshan-note">\n<p>متن\n..</p>\n</div>'
  )
})

test('without the extension, standard markdown behavior is preserved', () => {
  assert.equal(
    micromark('... نکته\nمتن\n...\n'),
    '<p>... نکته\nمتن\n...</p>\n'
  )
})

test('coexists with warning, caution, important and tip without interference', () => {
  const html = micromark(
    '... هشدار\nالف\n...\n\n... احتیاط\nب\n...\n\n... مهم\nج\n...\n\n... راهنما\nد\n...\n\n... نکته\nه\n...\n',
    {
      extensions: [warning(), caution(), important(), tip(), note()],
      htmlExtensions: [warningHtml(), cautionHtml(), importantHtml(), tipHtml(), noteHtml()]
    }
  )
  assert.equal(
    html,
    '<div class="parsneshan-warning">\n<p>الف</p>\n</div>\n' +
      '<div class="parsneshan-caution">\n<p>ب</p>\n</div>\n' +
      '<div class="parsneshan-important">\n<p>ج</p>\n</div>\n' +
      '<div class="parsneshan-tip">\n<p>د</p>\n</div>\n' +
      '<div class="parsneshan-note">\n<p>ه</p>\n</div>\n'
  )
})