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
    const { plugins = [], ...mdOptions } = options;

    // بارگذاری markdown-it
    let markdownit;
    try {
        markdownit = require('markdown-it');
    } catch (e) {
        throw new Error('پارس‌نشان: کتابخانه markdown-it یافت نشد. لطفاً ابتدا آن را نصب کنید: npm install markdown-it');
    }

    // ایجاد نمونه markdown-it با تنظیمات پیش‌فرض
    const md = markdownit({
        html: true,
        ...mdOptions
    });

    // اعمال افزونه‌های پارس‌نشان
    md.use(highlight_plugin);
    md.use(admonition_plugin);
    md.use(checklist_plugin);
    md.use(persian_ordered_list_plugin);
    md.use(poetry_plugin);
    md.use(auto_direction_plugin);

    // اعمال افزونه‌های کاربر
    plugins.forEach(pluginConfig => {
        if (Array.isArray(pluginConfig)) {
            // اگر افزونه به همراه تنظیمات بود: [plugin, { options }]
            md.use(...pluginConfig);
        } else {
            // اگر فقط خود افزونه بود
            md.use(pluginConfig);
        }
    });

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
