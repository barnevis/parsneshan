/**
 * تست ساده پارس‌نشان در Node.js
 */
const createParsNeshan = require('./parsneshan.js');

// ایجاد مفسر
const parsneshan = createParsNeshan();

// تست‌های ساده
const tests = [
    {
        name: 'عنوان فارسی',
        input: '## سلام دنیا!',
        expected: '<h2'
    },
    {
        name: 'هایلایت متن',
        input: 'این یک ==متن مهم== است.',
        expected: '<mark>'
    },
    {
        name: 'لیست با اعداد فارسی',
        input: '۱. آیتم اول\n۲. آیتم دوم',
        expected: '<ol>'
    }
];

console.log('تست پارس‌نشان در Node.js\n' + '='.repeat(30));

let passed = 0;
let failed = 0;

tests.forEach(test => {
    const result = parsneshan.render(test.input);
    if (result.includes(test.expected)) {
        console.log(`✓ ${test.name}`);
        passed++;
    } else {
        console.log(`✗ ${test.name}`);
        console.log(`  انتظار: ${test.expected}`);
        console.log(`  نتیجه: ${result}`);
        failed++;
    }
});

console.log(`\nنتیجه: ${passed} موفق، ${failed} ناموفق`);

if (failed > 0) {
    process.exit(1);
}
