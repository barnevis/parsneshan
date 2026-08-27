import {test} from 'node:test'
import assert from 'node:assert/strict'
import {micromark} from 'micromark'
import {important, importantHtml} from '../extensions/important/index.js'
import {warning, warningHtml} from '../extensions/warning/index.js'
import {caution, cautionHtml} from '../extensions/caution/index.js'
import {tip, tipHtml} from '../extensions/tip/index.js'
import {note, noteHtml} from '../extensions/note/index.js'

/** @type {import('micromark-util-types').Options} */
const options = {
  extensions: [important()],
  htmlExtensions: [importantHtml()]
}

/** @param {string} value */
function render(value) {
  return micromark(value, options)
}

test('basic important block', () => {
  assert.equal(
    render('... مهم\nمتن مهم\n...\n'),
    '<div class="parsneshan-important">\n<p>متن مهم</p>\n</div>\n'
  )
})

test('multiline content', () => {
  assert.equal(
    render('... مهم\nخط اول\nخط دوم\n...\n'),
    '<div class="parsneshan-important">\n<p>خط اول\nخط دوم</p>\n</div>\n'
  )
})

test('inline markdown in content', () => {
  assert.equal(
    render('... مهم\nمتن *مهم* و «خاص»\n...\n'),
    '<div class="parsneshan-important">\n<p>متن <em>مهم</em> و «خاص»</p>\n</div>\n'
  )
})

test('multiple blocks of content', () => {
  assert.equal(
    render('... مهم\nالف\n\nب\n...\n'),
    '<div class="parsneshan-important">\n<p>الف</p>\n<p>ب</p>\n</div>\n'
  )
})

test('list in content', () => {
  assert.equal(
    render('... مهم\n- یک\n- دو\n...\n'),
    '<div class="parsneshan-important">\n<ul>\n<li>یک</li>\n<li>دو</li>\n</ul>\n</div>\n'
  )
})

test('content around important stays outside', () => {
  assert.equal(
    render('قبل\n\n... مهم\nداخل\n...\n\nبعد\n'),
    '<p>قبل</p>\n<div class="parsneshan-important">\n<p>داخل</p>\n</div>\n<p>بعد</p>\n'
  )
})

test('unclosed important extends to end of document', () => {
  assert.equal(
    render('... مهم\nمتن\n'),
    '<div class="parsneshan-important">\n<p>متن</p>\n</div>'
  )
})

test('extra text on opening line invalidates the block', () => {
  assert.equal(
    render('... مهم خانه\nمتن\n...\n'),
    '<p>... مهم خانه\nمتن\n...</p>\n'
  )
})

test('other admonition words do not create an important', () => {
  assert.equal(
    render('... هشدار\nمتن\n...\n'),
    '<p>... هشدار\nمتن\n...</p>\n'
  )
})

test('incomplete label does not create an important', () => {
  assert.equal(
    render('... مه\nمتن\n...\n'),
    '<p>... مه\nمتن\n...</p>\n'
  )
})

test('closing line with trailing text does not close the block', () => {
  assert.equal(
    render('... مهم\nمتن\n... اضافه\n'),
    '<div class="parsneshan-important">\n<p>متن\n... اضافه</p>\n</div>'
  )
})

test('opening line without space after dots works', () => {
  assert.equal(
    render('...مهم\nمتن\n...\n'),
    '<div class="parsneshan-important">\n<p>متن</p>\n</div>\n'
  )
})

test('no indentation works', () => {
  assert.equal(
    render('... مهم\nمتن\n...\n'),
    '<div class="parsneshan-important">\n<p>متن</p>\n</div>\n'
  )
})

test('one space of indentation is allowed', () => {
  assert.equal(
    render(' ... مهم\n متن\n ...\n'),
    '<div class="parsneshan-important">\n<p>متن</p>\n</div>\n'
  )
})

test('two spaces of indentation are allowed', () => {
  assert.equal(
    render('  ... مهم\n  متن\n  ...\n'),
    '<div class="parsneshan-important">\n<p>متن</p>\n</div>\n'
  )
})

test('three spaces of indentation are allowed', () => {
  assert.equal(
    render('   ... مهم\n   متن\n   ...\n'),
    '<div class="parsneshan-important">\n<p>متن</p>\n</div>\n'
  )
})

test('four spaces of indentation is indented code, not an important', () => {
  assert.equal(
    micromark('    ... مهم\nمتن\n...\n', options),
    '<pre><code>... مهم\n</code></pre>\n<p>متن\n...</p>\n'
  )
})

test('important interrupts a paragraph', () => {
  assert.equal(
    render('پاراگراف\n... مهم\nمتن\n...\n'),
    '<p>پاراگراف</p>\n<div class="parsneshan-important">\n<p>متن</p>\n</div>\n'
  )
})

test('important inside list item preserves paragraph (regression)', () => {
  assert.equal(
    render('- یک\n  ... مهم\n  متن\n  ...\n'),
    '<ul>\n<li>یک<div class="parsneshan-important">\n<p>متن</p>\n</div>\n</li>\n</ul>\n'
  )
})

test('important inside a block quote', () => {
  assert.equal(
    render('> ... مهم\n> متن\n> ...\n'),
    '<blockquote><div class="parsneshan-important">\n<p>متن</p>\n</div>\n</blockquote>\n'
  )
})

test('nested markdown structure inside content', () => {
  const input = [
    '... مهم',
    '## عنوان',
    '',
    'پاراگراف',
    '...'
  ].join('\n')
  assert.equal(
    render(input),
    '<div class="parsneshan-important">\n<h2>عنوان</h2>\n<p>پاراگراف</p>\n</div>'
  )
})

test('closing fence must be exactly three dots', () => {
  assert.equal(
    render('... مهم\nمتن\n....\n'),
    '<div class="parsneshan-important">\n<p>متن\n....</p>\n</div>'
  )
})

test('closing fence with fewer than three dots does not close the block', () => {
  assert.equal(
    render('... مهم\nمتن\n..\n'),
    '<div class="parsneshan-important">\n<p>متن\n..</p>\n</div>'
  )
})

test('without the extension, standard markdown behavior is preserved', () => {
  assert.equal(
    micromark('... مهم\nمتن\n...\n'),
    '<p>... مهم\nمتن\n...</p>\n'
  )
})

test('coexists with warning, caution, tip and note without interference', () => {
  const html = micromark(
    '... هشدار\nالف\n...\n\n... احتیاط\nب\n...\n\n... مهم\nپ\n...\n\n... راهنما\nت\n...\n\n... نکته\nث\n...\n',
    {
      extensions: [warning(), caution(), important(), tip(), note()],
      htmlExtensions: [warningHtml(), cautionHtml(), importantHtml(), tipHtml(), noteHtml()]
    }
  )
  assert.equal(
    html,
    '<div class="parsneshan-warning">\n<p>الف</p>\n</div>\n' +
      '<div class="parsneshan-caution">\n<p>ب</p>\n</div>\n' +
      '<div class="parsneshan-important">\n<p>پ</p>\n</div>\n' +
      '<div class="parsneshan-tip">\n<p>ت</p>\n</div>\n' +
      '<div class="parsneshan-note">\n<p>ث</p>\n</div>\n'
  )
})