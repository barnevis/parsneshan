/**
 * @fileoverview افزونه برجسته‌سازی متن برای پارس‌نشان
 * @description این افزونه امکان برجسته کردن متن با استفاده از نشانه‌گذاری ==متن== را فراهم می‌کند
 * @author پارس‌نشان
 * @license MIT
 */

/**
 * افزونه برجسته‌سازی متن
 * 
 * این افزونه متن بین دو علامت مساوی (==متن==) را به تگ <mark> تبدیل می‌کند
 * 
 * @example
 * // ورودی مارک‌داون:
 * // این یک ==متن مهم== است
 * // 
 * // خروجی HTML:
 * // این یک <mark>متن مهم</mark> است
 * 
 * @param {import('markdown-it')} md - نمونه markdown-it
 * @returns {void}
 */
function highlight_plugin(md) {
    /**
     * قانون پردازش برجسته‌سازی
     * @param {Object} state - وضعیت فعلی پردازشگر
     * @param {boolean} silent - اگر true باشد، فقط بررسی می‌کند بدون تولید توکن
     * @returns {boolean} آیا الگو پیدا شد یا خیر
     */
    function highlight_rule(state, silent) {
        let start = state.pos;

        // بررسی شروع با ==
        if (state.src.charCodeAt(start) !== 0x3D /* = */ ||
            state.src.charCodeAt(start + 1) !== 0x3D /* = */) {
            return false;
        }

        let max = state.posMax;
        let pos = start + 2;

        // پیدا کردن پایان ==
        while (pos < max) {
            if (state.src.charCodeAt(pos) === 0x3D /* = */ &&
                state.src.charCodeAt(pos + 1) === 0x3D /* = */) {
                break;
            }
            pos++;
        }

        if (pos >= max - 1) {
            return false;
        }

        if (!silent) {
            let token = state.push('mark_open', 'mark', 1);
            token.markup = '==';
            token = state.push('text', '', 0);
            token.content = state.src.slice(start + 2, pos);
            token = state.push('mark_close', 'mark', -1);
            token.markup = '==';
        }

        state.pos = pos + 2;
        return true;
    }

    md.inline.ruler.before('emphasis', 'highlight', highlight_rule);
}

module.exports = highlight_plugin;
