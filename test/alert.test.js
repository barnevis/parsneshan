import {test} from 'node:test'
import assert from 'node:assert/strict'
import {micromark} from 'micromark'
import {alert, alertHtml} from '../extensions/alert/index.js'
import {warning, warningHtml} from '../extensions/warning/index.js'
import {caution, cautionHtml} from '../extensions/caution/index.js'

/** @type {import('micromark-util-types').Options} */
const options = {
  extensions: [alert()],
  htmlExtensions: [alertHtml()]
}

/** @param {string} value */
function render(value) {
  return micromark(value, options)
}

test('basic alert block', () => {
  assert.equal(
    render('... اخطار\nمتن اخطار\n...\n'),
    '<div class="parsneshan-alert">\n<p>متن اخطار</p>\n</div>\n'
  )
})

test('multiline content', () => {
  assert.equal(
    render('... اخطار\nخط اول\nخط دوم\n...\n'),
    '<div class="parsneshan-alert">\n<p>خط اول\nخط دوم</p>\n</div>\n'
  )
})

test('inline markdown in content', () => {
  assert.equal(
    render('... اخطار\nمتن *مهم* و «خاص»\n...\n'),
    '<div class="parsneshan-alert">\n<p>متن <em>مهم</em> و «خاص»</p>\n</div>\n'
  )
})

test('multiple blocks of content', () => {
  assert.equal(
    render('... اخطار\nالف\n\nب\n...\n'),
    '<div class="parsneshan-alert">\n<p>الف</p>\n<p>ب</p>\n</div>\n'
  )
})

test('list in content', () => {
  assert.equal(
    render('... اخطار\n- یک\n- دو\n...\n'),
    '<div class="parsneshan-alert">\n<ul>\n<li>یک</li>\n<li>دو</li>\n</ul>\n</div>\n'
  )
})

test('content around alert stays outside', () => {
  assert.equal(
    render('قبل\n\n... اخطار\nداخل\n...\n\nبعد\n'),
    '<p>قبل</p>\n<div class="parsneshan-alert">\n<p>داخل</p>\n</div>\n<p>بعد</p>\n'
  )
})

test('unclosed alert extends to end of document', () => {
  assert.equal(
    render('... اخطار\nمتن\n'),
    '<div class="parsneshan-alert">\n<p>متن</p>\n</div>'
  )
})

test('extra text on opening line invalidates the block', () => {
  assert.equal(
    render('... اخطار خانه\nمتن\n...\n'),
    '<p>... اخطار خانه\nمتن\n...</p>\n'
  )
})

test('other admonition words do not create an alert', () => {
  assert.equal(
    render('... هشدار\nمتن\n...\n'),
    '<p>... هشدار\nمتن\n...</p>\n'
  )
})

test('incomplete label does not create an alert', () => {
  assert.equal(
    render('... اخطا\nمتن\n...\n'),
    '<p>... اخطا\nمتن\n...</p>\n'
  )
})

test('closing line with trailing text does not close the block', () => {
  assert.equal(
    render('... اخطار\nمتن\n... اضافه\n'),
    '<div class="parsneshan-alert">\n<p>متن\n... اضافه</p>\n</div>'
  )
})

test('opening line without space after dots works', () => {
  assert.equal(
    render('...اخطار\nمتن\n...\n'),
    '<div class="parsneshan-alert">\n<p>متن</p>\n</div>\n'
  )
})

test('no indentation works', () => {
  assert.equal(
    render('... اخطار\nمتن\n...\n'),
    '<div class="parsneshan-alert">\n<p>متن</p>\n</div>\n'
  )
})

test('one space of indentation is allowed', () => {
  assert.equal(
    render(' ... اخطار\n متن\n ...\n'),
    '<div class="parsneshan-alert">\n<p>متن</p>\n</div>\n'
  )
})

test('two spaces of indentation are allowed', () => {
  assert.equal(
    render('  ... اخطار\n  متن\n  ...\n'),
    '<div class="parsneshan-alert">\n<p>متن</p>\n</div>\n'
  )
})

test('three spaces of indentation are allowed', () => {
  assert.equal(
    render('   ... اخطار\n   متن\n   ...\n'),
    '<div class="parsneshan-alert">\n<p>متن</p>\n</div>\n'
  )
})

test('four spaces of indentation is indented code, not an alert', () => {
  assert.equal(
    micromark('    ... اخطار\nمتن\n...\n', options),
    '<pre><code>... اخطار\n</code></pre>\n<p>متن\n...</p>\n'
  )
})

test('alert interrupts a paragraph', () => {
  assert.equal(
    render('پاراگراف\n... اخطار\nمتن\n...\n'),
    '<p>پاراگراف</p>\n<div class="parsneshan-alert">\n<p>متن</p>\n</div>\n'
  )
})

test('alert inside a block quote', () => {
  assert.equal(
    render('> ... اخطار\n> متن\n> ...\n'),
    '<blockquote><div class="parsneshan-alert">\n<p>متن</p>\n</div>\n</blockquote>\n'
  )
})

test('nested markdown structure inside content', () => {
  const input = [
    '... اخطار',
    '## عنوان',
    '',
    'پاراگراف',
    '...'
  ].join('\n')
  assert.equal(
    render(input),
    '<div class="parsneshan-alert">\n<h2>عنوان</h2>\n<p>پاراگراف</p>\n</div>'
  )
})

test('closing fence must be exactly three dots', () => {
  assert.equal(
    render('... اخطار\nمتن\n....\n'),
    '<div class="parsneshan-alert">\n<p>متن\n....</p>\n</div>'
  )
})

test('closing fence with fewer than three dots does not close the block', () => {
  assert.equal(
    render('... اخطار\nمتن\n..\n'),
    '<div class="parsneshan-alert">\n<p>متن\n..</p>\n</div>'
  )
})

test('without the extension, standard markdown behavior is preserved', () => {
  assert.equal(
    micromark('... اخطار\nمتن\n...\n'),
    '<p>... اخطار\nمتن\n...</p>\n'
  )
})

test('coexists with warning and caution without interference', () => {
  const html = micromark(
    '... هشدار\nالف\n...\n\n... احتیاط\nب\n...\n\n... اخطار\nپ\n...\n',
    {
      extensions: [warning(), caution(), alert()],
      htmlExtensions: [warningHtml(), cautionHtml(), alertHtml()]
    }
  )
  assert.equal(
    html,
    '<div class="parsneshan-warning">\n<p>الف</p>\n</div>\n' +
      '<div class="parsneshan-caution">\n<p>ب</p>\n</div>\n' +
      '<div class="parsneshan-alert">\n<p>پ</p>\n</div>\n'
  )
})
