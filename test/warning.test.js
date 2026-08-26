import {test} from 'node:test'
import assert from 'node:assert/strict'
import {micromark} from 'micromark'
import {warning, warningHtml} from '../extensions/warning/index.js'
import {caution, cautionHtml} from '../extensions/caution/index.js'
import {important, importantHtml} from '../extensions/important/index.js'
import {tip, tipHtml} from '../extensions/tip/index.js'

/** @type {import('micromark-util-types').Options} */
const options = {
  extensions: [warning()],
  htmlExtensions: [warningHtml()]
}

/** @param {string} value */
function render(value) {
  return micromark(value, options)
}

test('basic warning block', () => {
  assert.equal(
    render('... هشدار\nمتن هشدار\n...\n'),
    '<div class="parsneshan-warning">\n<p>متن هشدار</p>\n</div>\n'
  )
})

test('multiline content', () => {
  assert.equal(
    render('... هشدار\nخط اول\nخط دوم\n...\n'),
    '<div class="parsneshan-warning">\n<p>خط اول\nخط دوم</p>\n</div>\n'
  )
})

test('inline markdown in content', () => {
  assert.equal(
    render('... هشدار\nمتن *مهم* و «خاص»\n...\n'),
    '<div class="parsneshan-warning">\n<p>متن <em>مهم</em> و «خاص»</p>\n</div>\n'
  )
})

test('multiple blocks of content', () => {
  assert.equal(
    render('... هشدار\nالف\n\nب\n...\n'),
    '<div class="parsneshan-warning">\n<p>الف</p>\n<p>ب</p>\n</div>\n'
  )
})

test('list in content', () => {
  assert.equal(
    render('... هشدار\n- یک\n- دو\n...\n'),
    '<div class="parsneshan-warning">\n<ul>\n<li>یک</li>\n<li>دو</li>\n</ul>\n</div>\n'
  )
})

test('block quote in content', () => {
  assert.equal(
    render('... هشدار\n> نقل قول\n...\n'),
    '<div class="parsneshan-warning">\n<blockquote>\n<p>نقل قول</p>\n</blockquote>\n</div>\n'
  )
})

test('content around warning stays outside', () => {
  assert.equal(
    render('قبل\n\n... هشدار\nداخل\n...\n\nبعد\n'),
    '<p>قبل</p>\n<div class="parsneshan-warning">\n<p>داخل</p>\n</div>\n<p>بعد</p>\n'
  )
})

test('unclosed warning extends to end of document', () => {
  assert.equal(
    render('... هشدار\nمتن\n'),
    '<div class="parsneshan-warning">\n<p>متن</p>\n</div>'
  )
})

test('extra text on opening line invalidates the block', () => {
  assert.equal(
    render('... هشدار خانه\nمتن\n...\n'),
    '<p>... هشدار خانه\nمتن\n...</p>\n'
  )
})

test('other admonition words do not create a warning', () => {
  assert.equal(
    render('... احتیاط\nمتن\n...\n'),
    '<p>... احتیاط\nمتن\n...</p>\n'
  )
})

test('incomplete label does not create a warning', () => {
  assert.equal(
    render('... هشدا\nمتن\n...\n'),
    '<p>... هشدا\nمتن\n...</p>\n'
  )
})

test('closing line with trailing text does not close the block', () => {
  assert.equal(
    render('... هشدار\nمتن\n... اضافه\n'),
    '<div class="parsneshan-warning">\n<p>متن\n... اضافه</p>\n</div>'
  )
})

test('opening line without space after dots works', () => {
  assert.equal(
    render('...هشدار\nمتن\n...\n'),
    '<div class="parsneshan-warning">\n<p>متن</p>\n</div>\n'
  )
})

test('no indentation works', () => {
  assert.equal(
    render('... هشدار\nمتن\n...\n'),
    '<div class="parsneshan-warning">\n<p>متن</p>\n</div>\n'
  )
})

test('one space of indentation is allowed', () => {
  assert.equal(
    render(' ... هشدار\n متن\n ...\n'),
    '<div class="parsneshan-warning">\n<p>متن</p>\n</div>\n'
  )
})

test('two spaces of indentation are allowed', () => {
  assert.equal(
    render('  ... هشدار\n  متن\n  ...\n'),
    '<div class="parsneshan-warning">\n<p>متن</p>\n</div>\n'
  )
})

test('three spaces of indentation are allowed', () => {
  assert.equal(
    render('   ... هشدار\n   متن\n   ...\n'),
    '<div class="parsneshan-warning">\n<p>متن</p>\n</div>\n'
  )
})

test('four spaces of indentation is indented code, not a warning', () => {
  assert.equal(
    micromark('    ... هشدار\nمتن\n...\n', options),
    '<pre><code>... هشدار\n</code></pre>\n<p>متن\n...</p>\n'
  )
})

test('warning interrupts a paragraph', () => {
  assert.equal(
    render('پاراگراف\n... هشدار\nمتن\n...\n'),
    '<p>پاراگراف</p>\n<div class="parsneshan-warning">\n<p>متن</p>\n</div>\n'
  )
})

test('warning inside a block quote', () => {
  assert.equal(
    render('> ... هشدار\n> متن\n> ...\n'),
    '<blockquote><div class="parsneshan-warning">\n<p>متن</p>\n</div>\n</blockquote>\n'
  )
})

test('nested markdown structure inside content', () => {
  const input = [
    '... هشدار',
    '## عنوان',
    '',
    'پاراگراف',
    '...'
  ].join('\n')
  assert.equal(
    render(input),
    '<div class="parsneshan-warning">\n<h2>عنوان</h2>\n<p>پاراگراف</p>\n</div>'
  )
})

test('closing fence must be exactly three dots', () => {
  assert.equal(
    render('... هشدار\nمتن\n....\n'),
    '<div class="parsneshan-warning">\n<p>متن\n....</p>\n</div>'
  )
})

test('closing fence with fewer than three dots does not close the block', () => {
  assert.equal(
    render('... هشدار\nمتن\n..\n'),
    '<div class="parsneshan-warning">\n<p>متن\n..</p>\n</div>'
  )
})

test('without the extension, standard markdown behavior is preserved', () => {
  assert.equal(
    micromark('... هشدار\nمتن\n...\n'),
    '<p>... هشدار\nمتن\n...</p>\n'
  )
})

test('coexists with caution, important and tip without interference', () => {
  const html = micromark(
    '... هشدار\nالف\n...\n\n... احتیاط\nب\n...\n\n... مهم\nپ\n...\n\n... راهنما\nت\n...\n',
    {
      extensions: [warning(), caution(), important(), tip()],
      htmlExtensions: [warningHtml(), cautionHtml(), importantHtml(), tipHtml()]
    }
  )
  assert.equal(
    html,
    '<div class="parsneshan-warning">\n<p>الف</p>\n</div>\n' +
      '<div class="parsneshan-caution">\n<p>ب</p>\n</div>\n' +
      '<div class="parsneshan-important">\n<p>پ</p>\n</div>\n' +
      '<div class="parsneshan-tip">\n<p>ت</p>\n</div>\n'
  )
})
