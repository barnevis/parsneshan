/**
 * @fileoverview افزونه تشخیص خودکار جهت متن برای پارس‌نشان
 * @description این افزونه جهت متن (راست‌به‌چپ یا چپ‌به‌راست) را بر اساس محتوا تشخیص می‌دهد
 * @author پارس‌نشان
 * @license MIT
 */

/**
 * تشخیص جهت متن
 * 
 * @param {string} text - متن ورودی
 * @returns {'rtl'|'ltr'} جهت متن
 * 
 * @example
 * detectDirection('سلام') // 'rtl'
 * detectDirection('Hello') // 'ltr'
 */
function detectDirection(text) {
    const rtlRegex = /[\u0600-\u06FF]/;
    const ltrRegex = /[a-zA-Z]/;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (rtlRegex.test(char)) return 'rtl';
        if (ltrRegex.test(char)) return 'ltr';
    }

    return 'rtl'; // پیش‌فرض برای زبان فارسی
}

/**
 * افزونه تشخیص خودکار جهت
 * 
 * این افزونه بر اساس اولین نویسه معنادار هر بلوک، جهت متن را تشخیص داده
 * و ویژگی dir را به تگ‌های HTML اضافه می‌کند
 * 
 * @example
 * // ورودی:
 * // ## سلام
 * // Hello World
 * //
 * // خروجی:
 * // <h2 dir="rtl">سلام</h2>
 * // <p dir="ltr">Hello World</p>
 * 
 * @param {import('markdown-it')} md - نمونه markdown-it
 * @returns {void}
 */
function auto_direction_plugin(md) {
    /**
     * لیست تگ‌های بلوکی که جهت‌شان تنظیم می‌شود
     * @type {string[]}
     */
    const blockRules = [
        'paragraph_open',
        'heading_open',
        'list_item_open',
        'blockquote_open',
        'table_open'
    ];

    blockRules.forEach(ruleName => {
        const originalRule = md.renderer.rules[ruleName] || function (tokens, idx, options, env, self) {
            return self.renderToken(tokens, idx, options);
        };

        md.renderer.rules[ruleName] = function (tokens, idx, options, env, self) {
            const token = tokens[idx];
            let content = '';

            if (ruleName === 'table_open') {
                for (let j = idx + 1; j < tokens.length; j++) {
                    if (tokens[j].type === 'table_close') break;
                    if (tokens[j].type === 'inline') {
                        content = tokens[j].content;
                        break;
                    }
                }
            } else {
                let nextToken = tokens[idx + 1];
                if (nextToken && nextToken.type === 'inline') {
                    content = nextToken.content;
                } else if (tokens[idx + 2] && tokens[idx + 2].type === 'inline') {
                    content = tokens[idx + 2].content;
                }
            }

            if (content) {
                const direction = detectDirection(content);
                token.attrSet('dir', direction);
            }

            return originalRule(tokens, idx, options, env, self);
        };
    });
}

module.exports = auto_direction_plugin;
