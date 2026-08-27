# تاریخچه تغییرات

این سند بر اساس [Keep a Changelog](https://keepachangelog.com/) تنظیم شده و نسخه‌گذاری از [Semantic Versioning](https://semver.org/) پیروی می‌کند.

## Unreleased

### Added

- افزونهٔ بلوک هشدار (`warning`, `warningHtml`) با syntax `... هشدار` … `...`
- افزونهٔ بلوک احتیاط (`caution`, `cautionHtml`) با syntax `... احتیاط` … `...`
- افزونهٔ بلوک مهم (`important`, `importantHtml`) با syntax `... مهم` … `...`
- افزونهٔ بلوک راهنما (`tip`, `tipHtml`) با syntax `... راهنما` … `...`
- افزونهٔ بلوک نکته (`note`, `noteHtml`) با syntax `... نکته` … `...`
- افزونهٔ لیست مرتب با ارقام فارسی (`persianOrderedList`, `persianOrderedListHtml`) با syntax `۱. مورد` … `...`
- آزمون‌گاه زندهٔ پارس‌نشان (`npm run playground`)
- مستندات قابلیت‌ها، syntax و معماری

### Changed

- منطق tokenizer مشترک پنج افزونهٔ بلوکی در `extensions/shared/admonition.js` یکپارچه شد (بدون تغییر API عمومی و رفتار)
- نام فایل‌های آزمون به الگوی `*.test.js` تغییر کرد
- تغییر نام افزونه `alert` به `important` (واژه `اخطار` → `مهم`)

### Removed

- افزونه `alert` (جایگزین شده با `important`)