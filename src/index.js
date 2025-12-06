/**
 * پارس‌نشان - مفسر مارک‌داون فارسی
 * نقطه ورودی اصلی برای Node.js
 */
const highlight_plugin = require('./plugins/highlight');
const admonition_plugin = require('./plugins/admonition');
const checklist_plugin = require('./plugins/checklist');
const persian_ordered_list_plugin = require('./plugins/persian-list');
const poetry_plugin = require('./plugins/poetry');
const auto_direction_plugin = require('./plugins/auto-direction');

/**
 * ایجاد یک نمونه از مفسر پارس‌نشان
 * @param {Object} options - تنظیمات اختیاری
 * @param {Array} options.plugins - لیست پلاگین‌های اضافی
 * @returns {Object} نمونه markdown-it با پلاگین‌های پارس‌نشان
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

    // ایجاد نمونه markdown-it
    const md = markdownit({
        html: true,
        ...mdOptions
    });

    // اعمال پلاگین‌های پارس‌نشان
    md.use(highlight_plugin);
    md.use(admonition_plugin);
    md.use(checklist_plugin);
    md.use(persian_ordered_list_plugin);
    md.use(poetry_plugin);
    md.use(auto_direction_plugin);

    // اعمال پلاگین‌های کاربر
    plugins.forEach(pluginConfig => {
        if (Array.isArray(pluginConfig)) {
            md.use(...pluginConfig);
        } else {
            md.use(pluginConfig);
        }
    });

    return md;
}

// صادر کردن تابع اصلی و پلاگین‌ها
module.exports = createParsNeshan;
module.exports.createParsNeshan = createParsNeshan;
module.exports.plugins = {
    highlight: highlight_plugin,
    admonition: admonition_plugin,
    checklist: checklist_plugin,
    persianList: persian_ordered_list_plugin,
    poetry: poetry_plugin,
    autoDirection: auto_direction_plugin
};
