import {test} from 'node:test'
import assert from 'node:assert/strict'
import {micromark} from 'micromark'
import {warning, warningHtml} from '../extensions/warning/index.js'
import {
  persianListExtension,
  persianListHtml
} from '../extensions/persian-list/index.js'

/** @type {import('micromark-util-types').Options} */
const options = {
  extensions: [persianListExtension()],
  htmlExtensions: [persianListHtml()]
}

/** @param {string} value */
function render(value) {
  return micromark(value, options)
}

test('basic persian list', () => {
  assert.equal(
    render('۱. الف\n۲. ب\n'),
    '<ol>\n<li>الف</li>\n<li>ب</li>\n</ol>\n'
  )
})

test('persian list with parenthesis marker', () => {
  assert.equal(
    render('۱) الف\n۲) ب\n'),
    '<ol>\n<li>الف</li>\n<li>ب</li>\n</ol>\n'
  )
})

test('first number goes into the start attribute', () => {
  assert.equal(
    render('۲. الف\n۳. ب\n'),
    '<ol start="2">\n<li>الف</li>\n<li>ب</li>\n</ol>\n'
  )
})

test('start of one is omitted', () => {
  assert.equal(
    render('۱. الف\n'),
    '<ol>\n<li>الف</li>\n</ol>\n'
  )
})

test('multi-digit persian start', () => {
  assert.equal(
    render('۱۰. الف\n۱۱. ب\n'),
    '<ol start="10">\n<li>الف</li>\n<li>ب</li>\n</ol>\n'
  )
})

test('max nine persian digits', () => {
  assert.equal(
    render('۱۲۳۴۵۶۷۸۹. الف\n'),
    '<ol start="123456789">\n<li>الف</li>\n</ol>\n'
  )
})

test('ten persian digits do not form a list', () => {
  assert.equal(
    render('۱۲۳۴۵۶۷۸۹۰. الف\n'),
    '<p>۱۲۳۴۵۶۷۸۹۰. الف</p>\n'
  )
})

test('arabic-indic digits do not form a list', () => {
  assert.equal(
    render('١. الف\n٢. ب\n'),
    '<p>١. الف\n٢. ب</p>\n'
  )
})

test('arabic-indic digits do not interrupt or continue', () => {
  assert.equal(
    render('۱. الف\n١. عربی\n'),
    '<ol>\n<li>الف\n١. عربی</li>\n</ol>\n'
  )
})

test('digit without marker is not a list', () => {
  assert.equal(render('۱۲ الف\n'), '<p>۱۲ الف</p>\n')
})

test('mixed ascii list is not continued by persian digits', () => {
  assert.equal(
    render('1. الف\n۲. ب\n'),
    '<ol>\n<li>الف</li>\n</ol>\n<ol start="2">\n<li>ب</li>\n</ol>\n'
  )
})

test('persian list is not continued by ascii digits', () => {
  assert.equal(
    render('۱. الف\n2. ب\n'),
    '<ol>\n<li>الف</li>\n</ol>\n<ol start="2">\n<li>ب</li>\n</ol>\n'
  )
})

test('markers can not be mixed within one list', () => {
  assert.equal(
    render('۱. الف\n۲) ب\n'),
    '<ol>\n<li>الف</li>\n</ol>\n<ol start="2">\n<li>ب</li>\n</ol>\n'
  )
})

test('empty item', () => {
  assert.equal(
    render('۱.\n۲. ب\n'),
    '<ol>\n<li></li>\n<li>ب</li>\n</ol>\n'
  )
})

test('loose list', () => {
  assert.equal(
    render('۱. الف\n\n۲. ب\n'),
    '<ol>\n<li>\n<p>الف</p>\n</li>\n<li>\n<p>ب</p>\n</li>\n</ol>\n'
  )
})

test('continuation with indent', () => {
  assert.equal(
    render('۱. الف\n   ب\n'),
    '<ol>\n<li>الف\nب</li>\n</ol>\n'
  )
})

test('lazy continuation line', () => {
  assert.equal(
    render('۱. الف\nب\n'),
    '<ol>\n<li>الف\nب</li>\n</ol>\n'
  )
})

test('paragraphs inside items', () => {
  assert.equal(
    render('۱. الف\n\n   دوم\n\n۲. ب\n'),
    '<ol>\n<li>\n<p>الف</p>\n<p>دوم</p>\n</li>\n<li>\n<p>ب</p>\n</li>\n</ol>\n'
  )
})

test('only ۱ can interrupt a paragraph', () => {
  assert.equal(
    render('پاراگراف\n۱. الف\n'),
    '<p>پاراگراف</p>\n<ol>\n<li>الف</li>\n</ol>\n'
  )
})

test('other digits can not interrupt a paragraph', () => {
  assert.equal(
    render('پاراگراف\n۲. الف\n'),
    '<p>پاراگراف\n۲. الف</p>\n'
  )
})

test('multi-digit ۱۰ can not interrupt a paragraph', () => {
  assert.equal(
    render('پاراگراف\n۱۰. الف\n'),
    '<p>پاراگراف\n۱۰. الف</p>\n'
  )
})

test('۱ interrupting an empty list item is not allowed', () => {
  assert.equal(
    render('پاراگراف\n۱.\n'),
    '<p>پاراگراف\n۱.</p>\n'
  )
})

test('inside a block quote', () => {
  assert.equal(
    render('> ۱. الف\n> ۲. ب\n'),
    '<blockquote>\n<ol>\n<li>الف</li>\n<li>ب</li>\n</ol>\n</blockquote>\n'
  )
})

test('nested persian list inside a persian list', () => {
  assert.equal(
    render('۱. الف\n\n   ۱. زیر\n\n۲. ب\n'),
    '<ol>\n<li>\n<p>الف</p>\n<ol>\n<li>زیر</li>\n</ol>\n</li>\n<li>\n<p>ب</p>\n</li>\n</ol>\n'
  )
})

test('ascii list still works with the extension enabled', () => {
  assert.equal(
    render('1. الف\n2. ب\n'),
    '<ol>\n<li>الف</li>\n<li>ب</li>\n</ol>\n'
  )
})

test('ascii list keeps its start attribute with the extension enabled', () => {
  assert.equal(
    render('2. الف\n3. ب\n'),
    '<ol start="2">\n<li>الف</li>\n<li>ب</li>\n</ol>\n'
  )
})

test('unordered list still works with the extension enabled', () => {
  assert.equal(
    render('- الف\n- ب\n'),
    '<ul>\n<li>الف</li>\n<li>ب</li>\n</ul>\n'
  )
})

test('indented code is not a list', () => {
  assert.equal(
    render('    ۱. الف\n'),
    '<pre><code>۱. الف\n</code></pre>\n'
  )
})

test('carriage return line endings', () => {
  assert.equal(
    render('۱. الف\r\n۲. ب\r\n'),
    '<ol>\r\n<li>الف</li>\r\n<li>ب</li>\r\n</ol>\r\n'
  )
})

test('without the extension, persian digits are a paragraph', () => {
  assert.equal(
    micromark('۱. الف\n۲. ب\n'),
    '<p>۱. الف\n۲. ب</p>\n'
  )
})

test('coexists with the warning admonition', () => {
  assert.equal(
    micromark('... هشدار\n۱. الف\n۲. ب\n...\n', {
      extensions: [persianListExtension(), warning()],
      htmlExtensions: [persianListHtml(), warningHtml()]
    }),
    '<div class="parsneshan-warning">\n<ol>\n<li>الف</li>\n<li>ب</li>\n</ol>\n</div>\n'
  )
})
