import {test} from 'node:test'
import assert from 'node:assert/strict'
import {micromark} from 'micromark'
import {caution, cautionHtml} from '../extensions/caution/index.js'
import {warning, warningHtml} from '../extensions/warning/index.js'

/** @type {import('micromark-util-types').Options} */
const options = {
  extensions: [caution()],
  htmlExtensions: [cautionHtml()]
}

/** @param {string} value */
function render(value) {
  return micromark(value, options)
}

test('basic caution block', () => {
  assert.equal(
    render('... احتیاط\nمتن احتیاط\n...\n'),
    '<div class="parsneshan-caution">\n<p>متن احتیاط</p>\n</div>\n'
  )
})

test('multiline content', () => {
  assert.equal(
    render('... احتیاط\nخط اول\nخط دوم\n...\n'),
    '<div class="parsneshan-caution">\n<p>خط اول\nخط دوم</p>\n</div>\n'
  )
})

test('inline markdown in content', () => {
  assert.equal(
    render('... احتیاط\nمتن *مهم* و «خاص»\n...\n'),
    '<div class="parsneshan-caution">\n<p>متن <em>مهم</em> و «خاص»</p>\n</div>\n'
  )
})

test('multiple blocks of content', () => {
  assert.equal(
    render('... احتیاط\nالف\n\nب\n...\n'),
    '<div class="parsneshan-caution">\n<p>الف</p>\n<p>ب</p>\n</div>\n'
  )
})

test('list in content', () => {
  assert.equal(
    render('... احتیاط\n- یک\n- دو\n...\n'),
    '<div class="parsneshan-caution">\n<ul>\n<li>یک</li>\n<li>دو</li>\n</ul>\n</div>\n'
  )
})

test('content around caution stays outside', () => {
  assert.equal(
    render('قبل\n\n... احتیاط\nداخل\n...\n\nبعد\n'),
    '<p>قبل</p>\n<div class="parsneshan-caution">\n<p>داخل</p>\n</div>\n<p>بعد</p>\n'
  )
})

test('unclosed caution extends to end of document', () => {
  assert.equal(
    render('... احتیاط\nمتن\n'),
    '<div class="parsneshan-caution">\n<p>متن</p>\n</div>'
  )
})

test('extra text on opening line invalidates the block', () => {
  assert.equal(
    render('... احتیاط خانه\nمتن\n...\n'),
    '<p>... احتیاط خانه\nمتن\n...</p>\n'
  )
})

test('other admonition words do not create a caution', () => {
  assert.equal(
    render('... هشدار\nمتن\n...\n'),
    '<p>... هشدار\nمتن\n...</p>\n'
  )
})

test('incomplete label does not create a caution', () => {
  assert.equal(
    render('... احتیا\nمتن\n...\n'),
    '<p>... احتیا\nمتن\n...</p>\n'
  )
})

test('closing line with trailing text does not close the block', () => {
  assert.equal(
    render('... احتیاط\nمتن\n... اضافه\n'),
    '<div class="parsneshan-caution">\n<p>متن\n... اضافه</p>\n</div>'
  )
})

test('opening line without space after dots works', () => {
  assert.equal(
    render('...احتیاط\nمتن\n...\n'),
    '<div class="parsneshan-caution">\n<p>متن</p>\n</div>\n'
  )
})

test('up to three spaces of indentation are allowed', () => {
  assert.equal(
    render('   ... احتیاط\n   متن\n   ...\n'),
    '<div class="parsneshan-caution">\n<p>متن</p>\n</div>\n'
  )
})

test('four spaces of indentation is indented code, not a caution', () => {
  assert.equal(
    micromark('    ... احتیاط\nمتن\n...\n', options),
    '<pre><code>... احتیاط\n</code></pre>\n<p>متن\n...</p>\n'
  )
})

test('caution interrupts a paragraph', () => {
  assert.equal(
    render('پاراگراف\n... احتیاط\nمتن\n...\n'),
    '<p>پاراگراف</p>\n<div class="parsneshan-caution">\n<p>متن</p>\n</div>\n'
  )
})

test('caution inside a block quote', () => {
  assert.equal(
    render('> ... احتیاط\n> متن\n> ...\n'),
    '<blockquote><div class="parsneshan-caution">\n<p>متن</p>\n</div>\n</blockquote>\n'
  )
})

test('nested markdown structure inside content', () => {
  const input = [
    '... احتیاط',
    '## عنوان',
    '',
    'پاراگراف',
    '...'
  ].join('\n')
  assert.equal(
    render(input),
    '<div class="parsneshan-caution">\n<h2>عنوان</h2>\n<p>پاراگراف</p>\n</div>'
  )
})

test('closing fence must be exactly three dots', () => {
  assert.equal(
    render('... احتیاط\nمتن\n....\n'),
    '<div class="parsneshan-caution">\n<p>متن\n....</p>\n</div>'
  )
})

test('closing fence with fewer than three dots does not close the block', () => {
  assert.equal(
    render('... احتیاط\nمتن\n..\n'),
    '<div class="parsneshan-caution">\n<p>متن\n..</p>\n</div>'
  )
})

test('without the extension, standard markdown behavior is preserved', () => {
  assert.equal(
    micromark('... احتیاط\nمتن\n...\n'),
    '<p>... احتیاط\nمتن\n...</p>\n'
  )
})

test('coexists with the warning extension without interference', () => {
  const html = micromark(
    '... هشدار\nالف\n...\n\n... احتیاط\nب\n...\n',
    {
      extensions: [warning(), caution()],
      htmlExtensions: [warningHtml(), cautionHtml()]
    }
  )
  assert.equal(
    html,
    '<div class="parsneshan-warning">\n<p>الف</p>\n</div>\n' +
      '<div class="parsneshan-caution">\n<p>ب</p>\n</div>\n'
  )
})
