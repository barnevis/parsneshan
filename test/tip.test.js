import {test} from 'node:test'
import assert from 'node:assert/strict'
import {micromark} from 'micromark'
import {tip, tipHtml} from '../extensions/tip/index.js'
import {warning, warningHtml} from '../extensions/warning/index.js'
import {caution, cautionHtml} from '../extensions/caution/index.js'
import {important, importantHtml} from '../extensions/important/index.js'
import {note, noteHtml} from '../extensions/note/index.js'

/** @type {import('micromark-util-types').Options} */
const options = {
  extensions: [tip()],
  htmlExtensions: [tipHtml()]
}

/** @param {string} value */
function render(value) {
  return micromark(value, options)
}

test('basic tip block', () => {
  assert.equal(
    render('... راهنما\nمتن راهنما\n...\n'),
    '<div class="parsneshan-tip">\n<p>متن راهنما</p>\n</div>\n'
  )
})

test('multiline content', () => {
  assert.equal(
    render('... راهنما\nخط اول\nخط دوم\n...\n'),
    '<div class="parsneshan-tip">\n<p>خط اول\nخط دوم</p>\n</div>\n'
  )
})

test('inline markdown in content', () => {
  assert.equal(
    render('... راهنما\nمتن *مهم* و «خاص»\n...\n'),
    '<div class="parsneshan-tip">\n<p>متن <em>مهم</em> و «خاص»</p>\n</div>\n'
  )
})

test('multiple blocks of content', () => {
  assert.equal(
    render('... راهنما\nالف\n\nب\n...\n'),
    '<div class="parsneshan-tip">\n<p>الف</p>\n<p>ب</p>\n</div>\n'
  )
})

test('list in content', () => {
  assert.equal(
    render('... راهنما\n- یک\n- دو\n...\n'),
    '<div class="parsneshan-tip">\n<ul>\n<li>یک</li>\n<li>دو</li>\n</ul>\n</div>\n'
  )
})

test('content around tip stays outside', () => {
  assert.equal(
    render('قبل\n\n... راهنما\nداخل\n...\n\nبعد\n'),
    '<p>قبل</p>\n<div class="parsneshan-tip">\n<p>داخل</p>\n</div>\n<p>بعد</p>\n'
  )
})

test('unclosed tip extends to end of document', () => {
  assert.equal(
    render('... راهنما\nمتن\n'),
    '<div class="parsneshan-tip">\n<p>متن</p>\n</div>'
  )
})

test('extra text on opening line invalidates the block', () => {
  assert.equal(
    render('... راهنما خانه\nمتن\n...\n'),
    '<p>... راهنما خانه\nمتن\n...</p>\n'
  )
})

test('other admonition words do not create a tip', () => {
  assert.equal(
    render('... هشدار\nمتن\n...\n'),
    '<p>... هشدار\nمتن\n...</p>\n'
  )
})

test('incomplete label does not create a tip', () => {
  assert.equal(
    render('... راهنم\nمتن\n...\n'),
    '<p>... راهنم\nمتن\n...</p>\n'
  )
})

test('closing line with trailing text does not close the block', () => {
  assert.equal(
    render('... راهنما\nمتن\n... اضافه\n'),
    '<div class="parsneshan-tip">\n<p>متن\n... اضافه</p>\n</div>'
  )
})

test('opening line without space after dots works', () => {
  assert.equal(
    render('...راهنما\nمتن\n...\n'),
    '<div class="parsneshan-tip">\n<p>متن</p>\n</div>\n'
  )
})

test('no indentation works', () => {
  assert.equal(
    render('... راهنما\nمتن\n...\n'),
    '<div class="parsneshan-tip">\n<p>متن</p>\n</div>\n'
  )
})

test('one space of indentation is allowed', () => {
  assert.equal(
    render(' ... راهنما\n متن\n ...\n'),
    '<div class="parsneshan-tip">\n<p>متن</p>\n</div>\n'
  )
})

test('two spaces of indentation are allowed', () => {
  assert.equal(
    render('  ... راهنما\n  متن\n  ...\n'),
    '<div class="parsneshan-tip">\n<p>متن</p>\n</div>\n'
  )
})

test('three spaces of indentation are allowed', () => {
  assert.equal(
    render('   ... راهنما\n   متن\n   ...\n'),
    '<div class="parsneshan-tip">\n<p>متن</p>\n</div>\n'
  )
})

test('four spaces of indentation is indented code, not a tip', () => {
  assert.equal(
    micromark('    ... راهنما\nمتن\n...\n', options),
    '<pre><code>... راهنما\n</code></pre>\n<p>متن\n...</p>\n'
  )
})

test('tip interrupts a paragraph', () => {
  assert.equal(
    render('پاراگراف\n... راهنما\nمتن\n...\n'),
    '<p>پاراگراف</p>\n<div class="parsneshan-tip">\n<p>متن</p>\n</div>\n'
  )
})

test('tip inside a block quote', () => {
  assert.equal(
    render('> ... راهنما\n> متن\n> ...\n'),
    '<blockquote><div class="parsneshan-tip">\n<p>متن</p>\n</div>\n</blockquote>\n'
  )
})

test('nested markdown structure inside content', () => {
  const input = [
    '... راهنما',
    '## عنوان',
    '',
    'پاراگراف',
    '...'
  ].join('\n')
  assert.equal(
    render(input),
    '<div class="parsneshan-tip">\n<h2>عنوان</h2>\n<p>پاراگراف</p>\n</div>'
  )
})

test('closing fence must be exactly three dots', () => {
  assert.equal(
    render('... راهنما\nمتن\n....\n'),
    '<div class="parsneshan-tip">\n<p>متن\n....</p>\n</div>'
  )
})

test('closing fence with fewer than three dots does not close the block', () => {
  assert.equal(
    render('... راهنما\nمتن\n..\n'),
    '<div class="parsneshan-tip">\n<p>متن\n..</p>\n</div>'
  )
})

test('without the extension, standard markdown behavior is preserved', () => {
  assert.equal(
    micromark('... راهنما\nمتن\n...\n'),
    '<p>... راهنما\nمتن\n...</p>\n'
  )
})

test('coexists with warning, caution, important and note without interference', () => {
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