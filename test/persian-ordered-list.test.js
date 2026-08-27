import {warning, warningHtml} from '../extensions/warning/index.js'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {micromark} from 'micromark'
import {persianOrderedList, persianOrderedListHtml} from '../extensions/persian-ordered-list/index.js'

/** @type {import('micromark-util-types').Options} */
const options = {
  extensions: [persianOrderedList()],
  htmlExtensions: [persianOrderedListHtml()]
}

/** @param {string} value */
function render(value) {
  return micromark(value, options)
}

test('basic Persian numeral ordered list', () => {
  assert.equal(
    render('۱. اول\n۲. دوم\n۳. سوم\n'),
    '<ol>\n<li>اول</li>\n<li>دوم</li>\n<li>سوم</li>\n</ol>\n'
  )
})

test('Persian numeral ordered list with right parenthesis', () => {
  assert.equal(
    render('۱) اول\n۲) دوم\n۳) سوم\n'),
    '<ol>\n<li>اول</li>\n<li>دوم</li>\n<li>سوم</li>\n</ol>\n'
  )
})

test('multi-digit Persian numerals', () => {
  assert.equal(
    render('۱۰. دهم\n۱۱. یازدهم\n۱۲. دوازدهم\n'),
    '<ol start="10">\n<li>دهم</li>\n<li>یازدهم</li>\n<li>دوازدهم</li>\n</ol>\n'
  )
})

test('start number preserved', () => {
  assert.equal(
    render('۵. پنجم\n۶. ششم\n۷. هفتم\n'),
    '<ol start="5">\n<li>پنجم</li>\n<li>ششم</li>\n<li>هفتم</li>\n</ol>\n'
  )
})

test('single item list', () => {
  assert.equal(
    render('۱. تنها مورد\n'),
    '<ol>\n<li>تنها مورد</li>\n</ol>\n'
  )
})

test('list with blank lines between items', () => {
  assert.equal(
    render('۱. اول\n\n۲. دوم\n\n۳. سوم\n'),
    '<ol>\n<li>اول</li>\n<li>دوم</li>\n<li>سوم</li>\n</ol>\n'
  )
})

test('list with indentation (up to 3 spaces)', () => {
  assert.equal(
    render('  ۱. تورفته\n  ۲. دوم\n'),
    '<ol>\n<li>تورفته</li>\n<li>دوم</li>\n</ol>\n'
  )
})

test('four spaces indentation is code block, not list', () => {
  assert.equal(
    micromark('    ۱. کد\n', options),
    '<pre><code>۱. کد\n</code></pre>\n'
  )
})

test('nested list with Persian numerals', () => {
  assert.equal(
    render('۱. اول\n  ۱. زیرمجموعه اول\n  ۲. زیرمجموعه دوم\n۲. دوم\n'),
    '<ol>\n<li>اول\n<ol>\n<li>زیرمجموعه اول</li>\n<li>زیرمجموعه دوم</li>\n</ol>\n</li>\n<li>دوم</li>\n</ol>\n'
  )
})

test('mixed Persian and English numerals not mixed in same list', () => {
  // English numerals should still work
  assert.equal(
    micromark('1. اول\n2. دوم\n3. سوم\n'),
    '<ol>\n<li>اول</li>\n<li>دوم</li>\n<li>سوم</li>\n</ol>\n'
  )
})

test('English numerals still work independently', () => {
  const html = micromark('1. اول\n2. دوم\n\n۳. سوم\n۴. چهارم\n', {
    extensions: [persianOrderedList()],
    htmlExtensions: [persianOrderedListHtml()]
  })
  assert.equal(
    html,
    '<ol>\n<li>اول</li>\n<li>دوم</li>\n</ol>\n<ol start="3">\n<li>سوم</li>\n<li>چهارم</li>\n</ol>\n'
  )
})

test('list inside blockquote', () => {
  assert.equal(
    render('> ۱. اول\n> ۲. دوم\n> ۳. سوم\n'),
    '<blockquote>\n<ol>\n<li>اول</li>\n<li>دوم</li>\n<li>سوم</li>\n</ol>\n</blockquote>\n'
  )
})

test('list with continuation paragraphs', () => {
  assert.equal(
    render('۱. اول\n\nادامه اول\n۲. دوم\n'),
    '<ol>\n<li>اول\n<p>ادامه اول</p>\n</li>\n<li>دوم</li>\n</ol>\n'
  )
})

test('list with code block inside', () => {
  assert.equal(
    render('۱. اول\n\n    کد\n۲. دوم\n'),
    '<ol>\n<li>اول\n<pre><code>کد\n</code></pre>\n</li>\n<li>دوم</li>\n</ol>\n'
  )
})

test('list with blockquote inside', () => {
  assert.equal(
    render('۱. اول\n\n> نقل قول\n۲. دوم\n'),
    '<ol>\n<li>اول\n<blockquote>\n<p>نقل قول</p>\n</blockquote>\n</li>\n<li>دوم</li>\n</ol>\n'
  )
})

test('Persian numerals with different spacing', () => {
  assert.equal(
    render('۱.اول\n۲.دوم\n۳.سوم\n'),
    '<ol>\n<li>اول</li>\n<li>دوم</li>\n<li>سوم</li>\n</ol>\n'
  )
})

test('Persian numerals with tab after marker', () => {
  assert.equal(
    render('۱.\tاول\n۲.\tدوم\n'),
    '<ol>\n<li>اول</li>\n<li>دوم</li>\n</ol>\n'
  )
})

test('empty list item', () => {
  assert.equal(
    render('۱.\n۲. دوم\n'),
    '<ol>\n<li></li>\n<li>دوم</li>\n</ol>\n'
  )
})

test('list followed by paragraph', () => {
  assert.equal(
    render('۱. اول\n۲. دوم\n\nپاراگراف بعد از لیست\n'),
    '<ol>\n<li>اول</li>\n<li>دوم</li>\n</ol>\n<p>پاراگراف بعد از لیست</p>\n'
  )
})

test('paragraph followed by list', () => {
  assert.equal(
    render('پاراگراف قبل از لیست\n\n۱. اول\n۲. دوم\n'),
    '<p>پاراگراف قبل از لیست</p>\n<ol>\n<li>اول</li>\n<li>دوم</li>\n</ol>\n'
  )
})

test('list with thematic break inside', () => {
  assert.equal(
    render('۱. اول\n\n---\n۲. دوم\n'),
    '<ol>\n<li>اول</li>\n<li>دوم</li>\n</ol>\n<hr>\n'
  )
})

test('start number with multi-digit', () => {
  assert.equal(
    render('۹۹. نود و نه\n۱۰۰. صد\n۱۰۱. صد و یک\n'),
    '<ol start="99">\n<li>نود و نه</li>\n<li>صد</li>\n<li>صد و یک</li>\n</ol>\n'
  )
})

test('Persian numerals inside blockquote with nesting', () => {
  assert.equal(
    render('> ۱. اول\n>   ۱. زیرمجموعه\n> ۲. دوم\n> ۲. دوم\n'),
    '<blockquote>\n<ol>\n<li>اول\n<ol>\n<li>زیرمجموعه</li>\n</ol>\n</li>\n<li>دوم</li>\n</ol>\n</blockquote>\n'
  )
})

test('without extension, standard behavior preserved', () => {
  assert.equal(
    micromark('۱. اول\n۲. دوم\n۳. سوم\n'),
    '<p>۱. اول\n۲. دوم\n۳. سوم</p>\n'
  )
})

test('interrupting paragraph with Persian list', () => {
  assert.equal(
    render('پاراگراف\n۱. اول\n۲. دوم\n'),
    '<p>پاراگراف</p>\n<ol>\n<li>اول</li>\n<li>دوم</li>\n</ol>\n'
  )
})

test('list with Persian and English content mixed', () => {
  assert.equal(
    render('۱. First item\n۲. Second item\n'),
    '<ol>\n<li>First item</li>\n<li>Second item</li>\n</ol>\n'
  )
})

test('coexists with other parsneshan extensions', () => {
  const html = micromark(
    '... هشدار\nهشدار\n...\n\n۱. اول\n۲. دوم\n\n... نکته\nنکته\n...\n',
    {
      extensions: [persianOrderedList(), warning()],
      htmlExtensions: [persianOrderedListHtml(), warningHtml()]
    }
  )
  assert.ok(html.includes('<div class="parsneshan-warning">'))
  assert.ok(html.includes('<ol>'))
  assert.ok(html.includes('<li>اول</li>'))
  assert.ok(html.includes('<li>دوم</li>'))
})