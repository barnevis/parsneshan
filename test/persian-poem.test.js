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

test('three hemistichs on one line are invalid', () => {
  assert.equal(
    render('...شعر\nالف     ب     ج\n...\n'),
    '<p>...شعر\nالف     ب     ج\n...</p>\n'
  )
})

test('three hemistichs on one line invalidate the whole block', () => {
  assert.equal(
    render('...شعر\nالف     ب     ج\nد     ه\n...\n'),
    '<p>...شعر\nالف     ب     ج\nد     ه\n...</p>\n'
  )
})

test('opening fence allows up to three spaces of indentation', () => {
  assert.equal(
    render(' ...شعر\nالف     ب\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
  assert.equal(
    render('   ...شعر\nالف     ب\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
})

test('four spaces of indentation on the opening fence is indented code', () => {
  assert.equal(
    render('    ...شعر\nالف     ب\n...\n'),
    '<pre><code>...شعر\n</code></pre>\n<p>الف     ب\n...</p>\n'
  )
})

test('hemistich lines may be indented inside the block', () => {
  assert.equal(
    render('...شعر\n الف     ب\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
  assert.equal(
    render('...شعر\n    الف     ب\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
})

test('second line of a two-line verse may be indented', () => {
  assert.equal(
    render('...شعر\nالف\n  ب\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
})

test('blank separator line with only spaces invalidates the block', () => {
  // A line of spaces is not a blank line inside the block: the tokenizer
  // treats it as a hemistich of spaces, which makes the verse incomplete.
  assert.equal(
    render('...شعر\nالف     ب\n   \nج     د\n...\n'),
    '<p>...شعر\nالف     ب</p>\n<p>ج     د\n...</p>\n'
  )
})

test('closing fence allows up to three spaces of indentation', () => {
  assert.equal(
    render('...شعر\nالف     ب\n ...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
  assert.equal(
    render('...شعر\nالف     ب\n   ...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
})

test('closing fence with four spaces of indentation does not close the poem', () => {
  // The indented `...` is not a closing fence, so the block is invalid and
  // falls back to a paragraph; the paragraph drops the leading spaces of the
  // continuation line (standard CommonMark behavior).
  assert.equal(
    render('...شعر\nالف     ب\n    ...\n'),
    '<p>...شعر\nالف     ب\n...</p>\n'
  )
})

test('tab-indenting a hemistich keeps the tab in the raw text', () => {
  // Tabs are not separators per the spec, and are not trimmed from the raw
  // hemistich text.
  assert.equal(
    render('...شعر\n\tالف     ب\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">\tالف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
})

test('interaction with persian-list: list before and after a poem', () => {
  const both = {
    extensions: [persianPoem(), persianListExtension()],
    htmlExtensions: [persianPoemHtml(), persianListHtml()]
  }
  assert.equal(
    micromark('۱. مورد\n۲. مورد دوم\n\n...شعر\nالف     ب\n...\n', both),
    '<ol>\n<li>مورد</li>\n<li>مورد دوم</li>\n</ol>\n<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
  assert.equal(
    micromark('...شعر\nالف     ب\n...\n\n۱. مورد\n۲. مورد دوم\n', both),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n<ol>\n<li>مورد</li>\n<li>مورد دوم</li>\n</ol>\n'
  )
})

test('interaction with persian-list: persian digits inside hemistichs are raw text', () => {
  const both = {
    extensions: [persianPoem(), persianListExtension()],
    htmlExtensions: [persianPoemHtml(), persianListHtml()]
  }
  assert.equal(
    micromark('...شعر\n۱. مصرع     ۲. مصرع\n...\n', both),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">۱. مصرع</span><span class="parsneshan-hemistich">۲. مصرع</span></div>\n</div>\n'
  )
})

test('interaction with regular markdown lists', () => {
  assert.equal(
    render('1. one\n2. two\n\n...شعر\nالف     ب\n...\n'),
    '<ol>\n<li>one</li>\n<li>two</li>\n</ol>\n<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n'
  )
  assert.equal(
    render('...شعر\nالف     ب\n...\n\n1. one\n2. two\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n<ol>\n<li>one</li>\n<li>two</li>\n</ol>\n'
  )
  assert.equal(
    render('...شعر\n1. مصرع     2. مصرع\n...\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">1. مصرع</span><span class="parsneshan-hemistich">2. مصرع</span></div>\n</div>\n'
  )
})

test('interaction with blockquote: nested and adjacent', () => {
  assert.equal(
    render('> ...شعر\n> الف\n> ب\n> ...\n'),
    '<blockquote>\n<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n</blockquote>\n'
  )
  assert.equal(
    render('> ...شعر\n> الف     ب\n>\n> ج     د\n> ...\n'),
    '<blockquote>\n<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">ج</span><span class="parsneshan-hemistich">د</span></div>\n</div>\n</blockquote>\n'
  )
  assert.equal(
    render('...شعر\nالف     ب\n...\n\n> نقل\n'),
    '<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n<blockquote>\n<p>نقل</p>\n</blockquote>\n'
  )
})

test('interaction with blockquote in list', () => {
  assert.equal(
    render('- x\n\n  > ...شعر\n  > الف     ب\n  > ...\n'),
    '<ul>\n<li>\n<p>x</p>\n<blockquote>\n<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n</blockquote>\n</li>\n</ul>\n'
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
  // The warning’s content is re-parsed as Markdown, where the poem runs to
  // the end of the content: the single closing `...` is consumed by the
  // *warning* (the outer construct), so the poem itself is unclosed — its
  // complete verse still renders. Verified against the event stream: the
  // poem exits before the `...`, which becomes `parsneshanWarningFence`.
  assert.equal(
    micromark('... هشدار\n...شعر\nالف     ب\n...\n', {
      extensions: [persianPoem(), warning()],
      htmlExtensions: [persianPoemHtml(), warningHtml()]
    }),
    '<div class="parsneshan-warning">\n<div class="parsneshan-poem">\n<div class="parsneshan-verse"><span class="parsneshan-hemistich">الف</span><span class="parsneshan-hemistich">ب</span></div>\n</div>\n</div>\n'
  )
})
