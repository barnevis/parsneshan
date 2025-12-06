/**
 * @fileoverview افزونه جعبه‌های توضیحی برای پارس‌نشان
 * @description این افزونه امکان ایجاد جعبه‌های هشدار، توجه، نکته، مهم و احتیاط را فراهم می‌کند
 * @author پارس‌نشان
 * @license MIT
 */

/**
 * انواع جعبه‌های توضیحی پشتیبانی‌شده
 * @typedef {Object} AdmonitionType
 * @property {string} class - کلاس CSS برای استایل‌دهی
 * @property {string} title - عنوان نمایشی جعبه
 */

/**
 * @type {Object.<string, AdmonitionType>}
 */
const ADMONITION_TYPES = {
    'هشدار': { class: 'warning', title: 'هشدار' },
    'توجه': { class: 'note', title: 'توجه' },
    'نکته': { class: 'tip', title: 'نکته' },
    'مهم': { class: 'important', title: 'مهم' },
    'احتیاط': { class: 'caution', title: 'احتیاط' }
};

/**
 * افزونه جعبه‌های توضیحی
 * 
 * این افزونه بلوک‌های متنی با فرمت زیر را به جعبه‌های توضیحی تبدیل می‌کند:
 * 
 * @example
 * // ورودی مارک‌داون:
 * // ...توجه
 * // این یک پیام مهم است
 * // ...
 * //
 * // خروجی HTML:
 * // <div class="admonition note">
 * //   <p class="admonition-title">توجه</p>
 * //   <p>این یک پیام مهم است</p>
 * // </div>
 * 
 * @param {import('markdown-it')} md - نمونه markdown-it
 * @returns {void}
 */
function admonition_plugin(md) {
    const types = ADMONITION_TYPES;

    /**
     * قانون پردازش جعبه‌های توضیحی
     * @param {Object} state - وضعیت فعلی پردازشگر
     * @param {number} startLine - شماره خط شروع
     * @param {number} endLine - شماره خط پایان
     * @param {boolean} silent - اگر true باشد، فقط بررسی می‌کند
     * @returns {boolean} آیا الگو پیدا شد یا خیر
     */
    function admonition_rule(state, startLine, endLine, silent) {
        const startMarker = '...';
        const endMarker = '...';

        let pos = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];
        let firstLine = state.src.slice(pos, max);

        if (!firstLine.startsWith(startMarker)) return false;

        const keyword = firstLine.substring(startMarker.length).trim();
        if (!types[keyword]) return false;

        let nextLine = startLine;
        let foundEnd = false;

        while (nextLine < endLine) {
            nextLine++;
            if (nextLine >= endLine) break;

            pos = state.bMarks[nextLine] + state.tShift[nextLine];
            max = state.eMarks[nextLine];
            let currentLine = state.src.slice(pos, max).trim();

            if (currentLine === endMarker) {
                foundEnd = true;
                break;
            }
        }

        if (!foundEnd) return false;

        if (!silent) {
            const type = types[keyword];
            let token;

            token = state.push('admonition_open', 'div', 1);
            token.attrs = [['class', `admonition ${type.class}`]];
            token.block = true;

            token = state.push('admonition_title_open', 'p', 1);
            token.attrs = [['class', 'admonition-title']];
            token = state.push('text', '', 0);
            token.content = type.title;
            token = state.push('admonition_title_close', 'p', -1);

            const contentToRender = state.src.slice(state.bMarks[startLine + 1], state.bMarks[nextLine]);
            state.md.block.parse(contentToRender, state.md, state.env, state.tokens);

            token = state.push('admonition_close', 'div', -1);
        }

        state.line = nextLine + 1;
        return true;
    }

    md.block.ruler.before('fence', 'admonition', admonition_rule);
}

module.exports = admonition_plugin;
