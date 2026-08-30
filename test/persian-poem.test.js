import {test} from 'node:test'
import assert from 'node:assert/strict'
import {micromark} from 'micromark'
import {warning, warningHtml} from '../extensions/warning/index.js'
import {
  persianListExtension,
  persianListHtml
} from '../extensions/persian-list/index.js'
import {persianPoem, persianPoemHtml} from '../extensions/persian-poem/index.js'

/** @type {import('micromark-util-types').Options} */
const options = {
  extensions: [persianPoem()],
  htmlExtensions: [persianPoemHtml()]
}

/** @param {string} value */
function render(value) {
  return micromark(value, options)
}

const oneLineVerse = '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">تو نیکی می‌کن و در دجله انداز</span><span class="parsneshan-hemistich">که ایزد در بیابانت دهد باز</span></div>\n</div>\n'

test('one-line verse', () => {
  assert.equal(
    render(
      '...شعر\nتو نیکی می‌کن و در دجله انداز     که ایزد در بیابانت دهد باز\n...\n'
    ),
    oneLineVerse
  )
})

test('two-line verse produces the same html', () => {
  assert.equal(
    render('...شعر\nتو نیکی می‌کن و در دجله انداز\nکه ایزد در بیابانت دهد باز\n...\n'),
    oneLineVerse
  )
})

test('multiple one-line verses', () => {
  assert.equal(
    render('...شعر\nالف     ب\n\nج     د\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">ج</span><span class="parsneshan-hemistich">د</span></div>\n</div>\n'
  )
})

test('multiple two-line verses', () => {
  assert.equal(
    render('...شعر\nالف\nب\n\nج\nد\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">ج</span><span class="parsneshan-hemistich">د</span></div>\n</div>\n'
  )
})

test('extra blank lines do not create extra verses', () => {
  assert.equal(
    render('...شعر\nالف     ب\n\n\n\nج     د\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">ج</span><span class="parsneshan-hemistich">د</span></div>\n</div>\n'
  )
})

test('exact example from the spec', () => {
  assert.equal(
    render(
      '...شعر\nتو نیکی می‌کن و در دجله انداز     که ایزد در بیابانت دهد باز\n\nبه جهان خرم از آنم که جهان خرم از اوست     عاشقم بر همه عالم که همه عالم از اوست\n...\n'
    ),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">تو نیکی می‌کن و در دجله انداز</span><span class="parsneshan-hemistich">که ایزد در بیابانت دهد باز</span></div>\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">به جهان خرم از آنم که جهان خرم از اوست</span><span class="parsneshan-hemistich">عاشقم بر همه عالم که همه عالم از اوست</span></div>\n</div>\n'
  )
})

test('markdown is not parsed inside hemistichs', () => {
  assert.equal(
    render('...شعر\n**مهم** الف     ب *متن*\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">**مهم** الف</span><span class="parsneshan-hemistich">ب *متن*</span></div>\n</div>\n'
  )
})

test('html characters are escaped', () => {
  assert.equal(
    render('...شعر\n<a> الف     ب &\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">&lt;a&gt; الف</span><span class="parsneshan-hemistich">ب &amp;</span></div>\n</div>\n'
  )
})

test('space between dots and label is invalid', () => {
  assert.equal(
    render('... شعر\nالف     ب\n...\n'),
    '<p>... شعر\nالف     ب\n...</p>\n'
  )
})

test('extra text after the label is invalid', () => {
  assert.equal(
    render('...شعر خانه\nالف     ب\n...\n'),
    '<p>...شعر خانه\nالف     ب\n...</p>\n'
  )
})

test('fewer dots in the opening fence are invalid', () => {
  assert.equal(
    render('..شعر\nالف\nب\n...\n'),
    '<p>..شعر\nالف\nب\n...</p>\n'
  )
})

test('more dots in the opening fence are invalid', () => {
  assert.equal(
    render('....شعر\nالف\nب\n...\n'),
    '<p>....شعر\nالف\nب\n...</p>\n'
  )
})

test('mixing one-line and two-line forms is invalid (1)', () => {
  assert.equal(
    render('...شعر\nالف     ب\n\nج\nد\n...\n'),
    '<p>...شعر\nالف     ب</p>\n<p>ج\nد\n...</p>\n'
  )
})

test('mixing one-line and two-line forms is invalid (2)', () => {
  assert.equal(
    render('...شعر\nالف\nب\n\nج     د\n...\n'),
    '<p>...شعر\nالف\nب</p>\n<p>ج     د\n...</p>\n'
  )
})

test('missing blank line between one-line verses is invalid', () => {
  assert.equal(
    render('...شعر\nالف     ب\nج     د\n...\n'),
    '<p>...شعر\nالف     ب\nج     د\n...</p>\n'
  )
})

test('missing blank line between two-line verses is invalid', () => {
  assert.equal(
    render('...شعر\nالف\nب\nج\nد\n...\n'),
    '<p>...شعر\nالف\nب\nج\nد\n...</p>\n'
  )
})

test('incomplete verse before the closing fence is invalid', () => {
  assert.equal(
    render('...شعر\nالف\n...\n'),
    '<p>...شعر\nالف\n...</p>\n'
  )
})

test('incomplete verse at eof is invalid', () => {
  assert.equal(render('...شعر\nالف\n'), '<p>...شعر\nالف</p>\n')
})

test('incomplete verse before a blank line is invalid', () => {
  assert.equal(
    render('...شعر\nالف\n\nب\n...\n'),
    '<p>...شعر\nالف</p>\n<p>ب\n...</p>\n'
  )
})

test('four spaces are not a separator and make the block invalid', () => {
  assert.equal(
    render('...شعر\nالف    ب\n...\n'),
    '<p>...شعر\nالف    ب\n...</p>\n'
  )
})

test('a tab is not a separator', () => {
  assert.equal(
    render('...شعر\nالف\tب\n...\n'),
    '<p>...شعر\nالف\tب\n...</p>\n'
  )
})

test('unclosed poem runs to the end of the document', () => {
  assert.equal(
    render('...شعر\nالف     ب\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>'
  )
})

test('empty poem', () => {
  assert.equal(
    render('...شعر\n...\n'),
    '<div class="parsneshan-poem">\n</div>\n'
  )
})

test('trailing text on the closing fence invalidates the block', () => {
  assert.equal(
    render('...شعر\nالف     ب\n... اضافه\n'),
    '<p>...شعر\nالف     ب\n... اضافه</p>\n'
  )
})

test('four dots do not close the poem', () => {
  assert.equal(
    render('...شعر\nالف     ب\n....\n'),
    '<p>...شعر\nالف     ب\n....</p>\n'
  )
})

test('trailing spaces on the closing fence are allowed', () => {
  assert.equal(
    render('...شعر\nالف     ب\n...   \n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
})

test('more than five spaces as separator', () => {
  assert.equal(
    render('...شعر\nالف          ب\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
})

test('hemistich text is trimmed', () => {
  assert.equal(
    render('...شعر\n   الف     ب   \n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
})

test('poem interrupts a paragraph', () => {
  assert.equal(
    render('پاراگراف\n...شعر\nالف     ب\n...\n'),
    '<p>پاراگراف</p>\n<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
})

test('poem inside a block quote', () => {
  assert.equal(
    render('> ...شعر\n> الف     ب\n> ...\n'),
    '<blockquote>\n<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n</blockquote>\n'
  )
})

test('carriage return line endings', () => {
  assert.equal(
    render('...شعر\r\nالف     ب\r\n...\r\n'),
    '<div class="parsneshan-poem">\r\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\r\n</div>\r\n'
  )
})

test('without the extension, standard markdown behavior is preserved', () => {
  assert.equal(
    micromark('...شعر\nالف     ب\n...\n'),
    '<p>...شعر\nالف     ب\n...</p>\n'
  )
})

test('coexists with warning and persian-list without interference', () => {
  assert.equal(
    micromark(
      '... هشدار\nمتن\n...\n\n...شعر\nالف     ب\n\nج     د\n...\n\n۱. مورد\n۲. مورد دوم\n',
      {
        extensions: [persianPoem(), warning(), persianListExtension()],
        htmlExtensions: [persianPoemHtml(), warningHtml(), persianListHtml()]
      }
    ),
    '<div class="parsneshan-warning">\n<p>متن</p>\n</div>\n' +
      '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">ج</span><span class="parsneshan-hemistich">د</span></div>\n</div>\n' +
      '<ol>\n<li>مورد</li>\n<li>مورد دوم</li>\n</ol>\n'
  )
})

test('poem inside warning content', () => {
  // The poem’s closing `...` also closes the warning (both share the
  // closing fence), which is expected: nested `...` fences cannot be
  // distinguished.
  assert.equal(
    micromark('... هشدار\n...شعر\nالف     ب\n...\n', {
      extensions: [persianPoem(), warning()],
      htmlExtensions: [persianPoemHtml(), warningHtml()]
    }),
    '<div class="parsneshan-warning">\n<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n</div>\n'
  )
})
