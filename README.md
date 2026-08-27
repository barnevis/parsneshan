# پارس‌نشان

کتابخانه‌ای از افزونه‌های Markdown برای محتوای فارسی، ساخته‌شده بر پایهٔ [micromark](https://github.com/micromark/micromark).

پارس‌نشان parser مستقل نیست؛ پردازش Markdown استاندارد بر عهدهٔ `micromark` است و قابلیت‌های فارسی به‌صورت افزونهٔ استاندارد micromark به آن اضافه می‌شوند. بنابراین رفتار Markdown استاندارد حفظ می‌شود.

## قابلیت‌ها

| قابلیت | syntax | توضیح |
|---|---|---|
| هشدار | `... هشدار` … `...` | بلوک محصورکننده با محتوای Markdown کامل |
| احتیاط | `... احتیاط` … `...` | مانند هشدار با معنای متفاوت |
| مهم | `... مهم` … `...` | مانند هشدار با معنای متفاوت |
| راهنما | `... راهنما` … `...` | بلوک راهنمای کاربر |
| نکته | `... نکته` … `...` | بلوک نکته تکمیلی |
| لیست مرتب فارسی | `۱. مورد` … | لیست مرتب با ارقام فارسی |

جزئیات syntax در [`docs/syntax.md`](docs/syntax.md) آمده است.

## استفاده

```js
import {micromark} from 'micromark'
import {warning, warningHtml, caution, cautionHtml, important, importantHtml, tip, tipHtml, note, noteHtml, persianOrderedList, persianOrderedListHtml} from 'parsneshan'

const html = micromark('... هشدار\nمتن **مهم**\n...\n', {
  extensions: [warning(), caution(), important(), tip(), note(), persianOrderedList()],
  htmlExtensions: [warningHtml(), cautionHtml(), importantHtml(), tipHtml(), noteHtml(), persianOrderedListHtml()]
})
```

خروجی:

```html
<div class="parsneshan-warning">
<p>متن <strong>مهم</strong></p>
</div>
```

هر افزونه دو بخش دارد: syntax extension برای `extensions` و HTML extension برای `htmlExtensions`. می‌توان فقط بخشی را فعال کرد؛ بدون فعال بودن افزونه، متن به‌صورت پاراگراف معمولی رندر می‌شود.

## API عمومی

| تابع | خروجی |
|---|---|
| `warning()` / `caution()` / `important()` / `tip()` / `note()` / `persianOrderedList()` | Syntax extension |
| `warningHtml()` / `cautionHtml()` / `importantHtml()` / `tipHtml()` / `noteHtml()` / `persianOrderedListHtml()` | HTML extension (`<div class="parsneshan-*">` یا `<ol>`) |

افزونه‌ها همچنین از مسیرهای جداگانه در دسترس‌اند: `parsneshan/extensions/warning`، `parsneshan/extensions/caution`، `parsneshan/extensions/important`، `parsneshan/extensions/tip`، `parsneshan/extensions/note` و `parsneshan/extensions/persian-ordered-list`.

## آزمایشگاه

برای آزمایش زنده:

```sh
npm run playground
```

سپس `http://localhost:3000` را باز کنید.

## توسعه

* پیش‌نیاز: نسخهٔ جدید Node.js (پروژه ESM است).
* اجرای آزمون‌ها: `npm test`
* ساختار فنی و معماری: [`docs/architecture.md`](docs/architecture.md)
* syntax افزونه‌ها: [`docs/syntax.md`](docs/syntax.md)

## مجوز

MIT