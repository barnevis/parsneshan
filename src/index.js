/**
 * @fileoverview پارس‌نشان - مفسر مارک‌داون فارسی
 * @description کتابخانه‌ای برای تبدیل مارک‌داون به HTML با پشتیبانی کامل از زبان فارسی
 * @author پارس‌نشان
 * @license MIT
 * @version 1.1.0
 */

const highlight_plugin = require('./plugins/highlight');
const admonition_plugin = require('./plugins/admonition');
const checklist_plugin = require('./plugins/checklist');
const persian_ordered_list_plugin = require('./plugins/persian-list');
const poetry_plugin = require('./plugins/poetry');
const auto_direction_plugin = require('./plugins/auto-direction');

/**
 * تنظیمات ایجاد پارس‌نشان
 * @typedef {Object} ParsNeshanOptions
 * @property {Array} [plugins=[]] - لیست افزونه‌های اضافی markdown-it
 * @property {boolean} [html=true] - اجازه HTML خام در ورودی
 * @property {boolean} [linkify=false] - تبدیل خودکار لینک‌ها
 * @property {boolean} [typographer=false] - جایگزینی نویسه‌های تایپوگرافی
 */

/**
 * ایجاد یک نمونه از مفسر پارس‌نشان
 * 
 * این تابع یک نمونه markdown-it با تمام افزونه‌های پارس‌نشان از پیش فعال‌شده
 * برمی‌گرداند. می‌توانید افزونه‌های اضافی نیز به آن اضافه کنید.
 * 
 * @param {ParsNeshanOptions} [options={}] - تنظیمات اختیاری
 * @returns {import('markdown-it')} نمونه markdown-it با افزونه‌های پارس‌نشان
 * @throws {Error} اگر markdown-it نصب نباشد
 * 
 * @example
 * // استفاده ساده
 * const createParsNeshan = require('parsneshan');
 * const parsneshan = createParsNeshan();
 * const html = parsneshan.render('## سلام دنیا!');
 * 
 * @example
 * // با افزونه‌های اضافی
 * const parsneshan = createParsNeshan({
 *   plugins: [require('markdown-it-emoji')]
 * });
 */
function createParsNeshan(options = {}) {
    const { plugins: userPlugins = [], ...mdOptions } = options;

    // بارگذاری markdown-it
    let markdownit;
    try {
        markdownit = require('markdown-it');
    } catch (e) {
        throw new Error('پارس‌نشان: کتابخانه markdown-it یافت نشد. لطفاً ابتدا آن را نصب کنید: npm install markdown-it');
    }

    // ایجاد نمونه markdown-it با تنظیمات پیش‌فرض امن
    const md = markdownit({
        html: false, // غیرفعال به صورت پیش‌فرض برای جلوگیری از XSS
        ...mdOptions
    });

    /**
     * لیست افزونه‌های داخلی پارس‌نشان
     * @type {Array<{name: string, plugin: Function}>}
     */
    const internalPlugins = [
        { name: 'برجسته‌سازی', plugin: highlight_plugin },
        { name: 'جعبه‌های توضیحی', plugin: admonition_plugin },
        { name: 'بازبینه‌ها', plugin: checklist_plugin },
        { name: 'لیست فارسی', plugin: persian_ordered_list_plugin },
        { name: 'شعر', plugin: poetry_plugin },
        { name: 'تشخیص جهت', plugin: auto_direction_plugin }
    ];

    // اعمال افزونه‌های پارس‌نشان با مدیریت خطا
    internalPlugins.forEach(({ name, plugin }) => {
        try {
            md.use(plugin);
        } catch (e) {
            console.error(`پارس‌نشان: خطا در بارگذاری افزونه «${name}»:`, e.message);
        }
    });

    // اعمال افزونه‌های کاربر با مدیریت خطا
    userPlugins.forEach((pluginConfig, index) => {
        try {
            if (Array.isArray(pluginConfig)) {
                md.use(...pluginConfig);
            } else {
                md.use(pluginConfig);
            }
        } catch (e) {
            console.error(`پارس‌نشان: خطا در بارگذاری افزونه کاربر شماره ${index + 1}:`, e.message);
        }
    });

    // ذخیره متد render اصلی
    const originalRender = md.render.bind(md);

    /**
     * رندر مارک‌داون با مدیریت خطا
     * @param {string} src - متن مارک‌داون
     * @param {Object} [env={}] - محیط رندر
     * @returns {string} خروجی HTML
     */
    md.render = function (src, env = {}) {
        // بررسی ورودی
        if (typeof src !== 'string') {
            console.error('پارس‌نشان: ورودی باید رشته باشد. نوع دریافتی:', typeof src);
            return '';
        }

        try {
            return originalRender(src, env);
        } catch (e) {
            console.error('پارس‌نشان: خطا در رندر مارک‌داون:', e.message);
            // بازگشت متن اصلی به صورت escape شده در صورت خطا
            return `<pre>${escapeHtml(src)}</pre>`;
        }
    };

    /**
     * تابع کمکی برای escape کردن HTML
     * @param {string} str - رشته ورودی
     * @returns {string} رشته escape شده
     */
    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    return md;
}

/**
 * افزونه‌های پارس‌نشان برای استفاده جداگانه
 * @type {Object}
 * @property {Function} highlight - افزونه برجسته‌سازی متن
 * @property {Function} admonition - افزونه جعبه‌های توضیحی
 * @property {Function} checklist - افزونه بازبینه‌ها
 * @property {Function} persianList - افزونه لیست با اعداد فارسی
 * @property {Function} poetry - افزونه نمایش شعر
 * @property {Function} autoDirection - افزونه تشخیص خودکار جهت
 * 
 * @example
 * // استفاده از یک افزونه به تنهایی
 * const markdownit = require('markdown-it');
 * const { plugins } = require('parsneshan');
 * 
 * const md = markdownit();
 * md.use(plugins.highlight);
 * md.use(plugins.poetry);
 */
const plugins = {
    highlight: highlight_plugin,
    admonition: admonition_plugin,
    checklist: checklist_plugin,
    persianList: persian_ordered_list_plugin,
    poetry: poetry_plugin,
    autoDirection: auto_direction_plugin
};

// صادرات اصلی
module.exports = createParsNeshan;

// صادرات نام‌دار
module.exports.createParsNeshan = createParsNeshan;
module.exports.plugins = plugins;
