/**
 * @fileoverview افزونه پشتیبانی از اعداد فارسی در لیست‌های مرتب
 * @description این افزونه امکان استفاده از اعداد فارسی (۱، ۲، ۳، ...) در لیست‌های مرتب را فراهم می‌کند
 * @author پارس‌نشان
 * @license MIT
 */

/**
 * تبدیل اعداد فارسی به انگلیسی
 * 
 * @param {string} str - رشته حاوی اعداد فارسی
 * @returns {string} رشته با اعداد انگلیسی
 * 
 * @example
 * convertPersianToArabicNumbers('۱۲۳') // '123'
 */
function convertPersianToArabicNumbers(str) {
    const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (let i = 0; i < 10; i++) {
        str = str.replace(persianNumbers[i], arabicNumbers[i]);
    }
    return str;
}

/**
 * افزونه لیست مرتب فارسی
 * 
 * این افزونه لیست‌های مرتب با اعداد فارسی را پشتیبانی می‌کند
 * 
 * @example
 * // ورودی مارک‌داون:
 * // ۱. آیتم اول
 * // ۲. آیتم دوم
 * //
 * // به درستی به لیست مرتب HTML تبدیل می‌شود
 * 
 * @param {import('markdown-it')} md - نمونه markdown-it
 * @returns {void}
 */
function persian_ordered_list_plugin(md) {
    /**
     * مترجم لیست فارسی - اعداد فارسی را به انگلیسی تبدیل می‌کند
     * @param {Object} state - وضعیت فعلی پردازشگر
     */
    function persian_list_translator(state) {
        // الگو: (شروع خط)(فاصله‌ها)(عدد فارسی)(نقطه و فاصله)
        const regex = /^(\s*)([۰-۹]+)\. /gm;

        state.src = state.src.replace(regex, (match, indentation, persianNumber) => {
            const englishNumber = convertPersianToArabicNumbers(persianNumber);
            return `${indentation}${englishNumber}. `;
        });
    }

    md.core.ruler.before('block', 'persian_ordered_list', persian_list_translator);
}

module.exports = persian_ordered_list_plugin;
