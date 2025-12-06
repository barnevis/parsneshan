/**
 * عبارات منظم از پیش کامپایل‌شده برای تشخیص جهت
 * @constant
 */
const RTL_CHARS = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LTR_CHARS = /[A-Za-z\u00C0-\u00FF\u0100-\u017F]/;
const FIRST_STRONG_CHAR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z\u00C0-\u00FF\u0100-\u017F]/;

/**
 * کش نتایج تشخیص جهت برای بهبود عملکرد
 * @type {Map<string, 'rtl'|'ltr'>}
 */
const directionCache = new Map();

/** حداکثر اندازه کش */
const MAX_CACHE_SIZE = 1000;

/**
 * تشخیص جهت متن بهینه‌شده
 * 
 * این تابع از کش برای جلوگیری از محاسبات تکراری استفاده می‌کند
 * و فقط اولین نویسه معنادار را بررسی می‌کند
 * 
 * @param {string} text - متن ورودی
 * @returns {'rtl'|'ltr'} جهت متن
 * 
 * @example
 * detectDirection('سلام') // 'rtl'
 * detectDirection('Hello') // 'ltr'
 */
function detectDirection(text) {
    // بررسی ورودی خالی
    if (!text || typeof text !== 'string') {
        return 'rtl';
    }

    // استفاده از ۵۰ نویسه اول برای کلید کش (بهینه‌سازی حافظه)
    const cacheKey = text.slice(0, 50);

    // بررسی کش
    if (directionCache.has(cacheKey)) {
        return directionCache.get(cacheKey);
    }

    // پیدا کردن اولین نویسه معنادار
    const match = text.match(FIRST_STRONG_CHAR);

    let direction = 'rtl'; // پیش‌فرض برای زبان فارسی

    if (match) {
        const char = match[0];
        direction = RTL_CHARS.test(char) ? 'rtl' : 'ltr';
    }

    // ذخیره در کش با محدودیت اندازه
    if (directionCache.size >= MAX_CACHE_SIZE) {
        // حذف اولین آیتم (ساده‌ترین استراتژی LRU)
        const firstKey = directionCache.keys().next().value;
        directionCache.delete(firstKey);
    }
    directionCache.set(cacheKey, direction);

    return direction;
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
