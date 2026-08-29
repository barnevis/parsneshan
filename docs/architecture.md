# معماری پارس‌نشان

این سند ساختار فنی پروژه و نحوهٔ توسعهٔ آن را توضیح می‌دهد.

## اصل پایه

پارس‌نشان parser مستقل نیست. پردازش Markdown استاندارد بر عهدهٔ `micromark` است و هر قابلیت جدید به‌صورت یک افزونهٔ استاندارد micromark پیاده‌سازی می‌شود؛ هیچ تغییری در هستهٔ micromark انجام نمی‌شود.

## انواع افزونه در micromark

هر قابلیت در micromark دو بخش دارد:

* **Syntax extension:** تعیین می‌کند متن چگونه tokenized شود (`{flow, document, text, ...}` از constructها).
* **HTML extension:** تعیین می‌کند هنگام compile، برای هر توکن چه HTMLای تولید شود (`{enter, exit}` با `this.tag()`).

پارس‌نشان برای هر قابلیت هر دو بخش را ارائه می‌دهد (مانند `warning()` و `warningHtml()`).

## الگوی پیاده‌سازی بلوک‌های محصورکننده

بلوک‌های فعلی (`هشدار`، `احتیاط`، `مهم`، ‍`راهنما` و `نکته`) یک الگوی مشترک دارند: fence آغازین بدون پیشوند خطی و محتوایی که باید به‌صورت Markdown کامل پردازش شود.

برای این الگو، container معمولِ micromark (مانند blockquote که prefix خطی دارد) مناسب نیست: خطوط محتوا بدون marker هستند و سازوکار lazy continuation کانتینرها مرز بلوک را خراب می‌کند. الگوی به‌کاررفته — همسان با `micromark-extension-directive` — این است:

* یک **flow construct** با `concrete: true` که کل بلوک را در یک tokenizer مصرف می‌کند.
* محتوای بین دو fence به‌صورت توکن‌های `chunkDocument` (با `contentTypeDocument`) جمع می‌شود که توسط subtokenize به‌عنوان **سند کامل Markdown** دوباره پردازش می‌شوند؛ به همین دلیل تمام عناصر استاندارد درون بلوک کار می‌کنند.
* تشخیص fence پایانی (`...` با دقیقاً سه نقطه و فقط فضای اختیاری) در ابتدای هر خط محتوا انجام می‌شود.
* مدیریت lazy line مطابق الگوی directive انجام می‌شود (`nonLazyLine` + تنظیم `parser.lazy`).
* ثبت construct تحت کلید کد کاراکتر `.` (46) در `flow` است؛ تورفتگی تا سه فاصله قبل از رسیدن به construct توسط flow initializer حذف می‌شود و چهار فاصله طبق استاندارد به `codeIndented` می‌رود.

## ساختار پروژه

```text
index.js                     API عمومی (re-export افزونه‌ها)
package.json                 ESM، exports map، اسکریپت‌ها
extensions/
├── shared/
│   └── admonition.js        factory مشترک createAdmonition
├── warning/index.js         config + API عمومی warning
├── caution/index.js         config + API عمومی caution
├── important/index.js       config + API عمومی important
├── tip/index.js             config + API عمومی tip
├── note/index.js            config + API عمومی note
├── persian-list/index.js    لیست عددی فارسی (construct مستقل)
test/                        آزمون‌ها با node:test (*.test.js)
docs/                        مستندات
playground/                  آزمایشگاه زنده
```

### factory مشترک

پنج افزونهٔ فعلی ساختار یکسانی دارند؛ منطق tokenizer آن‌ها یک‌بار در `createAdmonition({typeName, label, className})` پیاده‌ شده است. هر افزونه فقط سه مقدار اختصاصی خود را می‌دهد و دو تابع `syntax()` و `html()` را دریافت می‌کند. نام توکن‌های داخلی از `typeName` مشتق می‌شوند (`parsneshanWarningFence`، ...).

افزودن قابلیت هم‌ساختار جدید = افزودن یک `extensions/<name>/index.js` چندخطی. قابلیت با ساختار متفاوت باید tokenizer مستقل خود را داشته باشد.

### قابلیت‌های ساختار متفاوت

* **`persian-list` (لیست عددی فارسی):** container construct مستقل در `extensions/persian-list/index.js`، الگودهٔوفادار به `list` هستهٔ micromark. دلیل عدم composition: construct هسته، predicate ارقام (`asciiDigit`) و ارجاع به خود در continuation را از طریق closure قفل کرده و نقطهٔ تزریق ندارد؛ به‌علاوه ثبت extension در map `document` merge می‌شود نه replace، پس construct مستقل زیر code pointهای ارقام فارسی (U+06F0 تا U+06F9) بدون تداخل با لیست‌های ASCII ثبت می‌شود. continuation آیتم‌های بعدی همان construct فارسی را attempt می‌کند (نه `list` هسته)، بنابراین لیست‌های فارسی و ASCII هرگز با هم ادغام نمی‌شوند. توکن‌های استاندارد لیست (`listOrdered`، `listItemPrefix`، ...) با `_container: true` تولید می‌شوند تا تشخیص tight/loose و ساختار `<ol>`/`<li>` توسط کامپایلر پیش‌فرض انجام شود؛ تنها هندلر `enter.listItemValue` در HTML extension بازنویسی شده چون `Number.parseInt` ارقام فارسی را نمی‌فهمد (برای `start` attribute دستی پارس می‌شود؛ ASCII هم برای سازگاری کامل نگه داشته شده است).

### گام‌های افزودن افزونهٔ جدید

1. ایجاد `extensions/<name>/index.js`
2. ثبت export در `index.js` ریشه و `exports` فایل `package.json`
3. نوشتن آزمون در `test/<name>.test.js`
4. نوشتن مستندات کاربر برای قابلیت (مثلاً بخش مربوطه در `docs/syntax.md`)

## جریان پردازش

```text
متن Markdown
  → micromark({extensions})     tokenize با constructهای افزونه
      → subtokenize             پردازش chunkDocumentها به‌عنوان سند کامل
  → micromark({htmlExtensions}) تولید HTML از توکن‌ها
```

## آزمون

آزمون‌ها با runner داخلی Node (`node --test`) اجرا می‌شوند و وابستگی آزمونی وجود ندارد. هر قابلیت فایل آزمون مستقل دارد و علاوه بر حالات معتبر، حالات مرزی و سازگاری با Markdown استاندارد و همزیستی افزونه‌ها را پوشش می‌دهد.

## آزمایشگاه

`playground/server.js` یک سرور ایستای کوچک (فقط `node:http`) است که هنگام سرو کردن فایل‌های JS/HTML، specifierهای bare را با resolve کردن ورودی هر پکیج از `package.json` آن به مسیر مطلق بازنویسی می‌کند. به این ترتیب مرورگر بدون bundler و بدون importmap دستی، مستقیماً از کد واقعی پروژه استفاده می‌کند.
