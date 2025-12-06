/**
 * @fileoverview افزونه نمایش شعر برای پارس‌نشان
 * @description این افزونه امکان نمایش اشعار فارسی با قالب‌بندی مناسب را فراهم می‌کند
 * @author پارس‌نشان
 * @license MIT
 */

/**
 * افزونه نمایش شعر
 * 
 * این افزونه بلوک‌های شعر را با قالب‌بندی کلاسیک نمایش می‌دهد.
 * هر بیت در دو ستون نمایش داده می‌شود.
 * 
 * @example
 * // ورودی مارک‌داون:
 * // ...شعر
 * // بنی آدم اعضای یکدیگرند
 * // که در آفرینش ز یک گوهرند
 * // ...
 * //
 * // خروجی HTML به صورت گرید دو ستونه نمایش داده می‌شود
 * 
 * @param {import('markdown-it')} md - نمونه markdown-it
 * @returns {void}
 */
function poetry_plugin(md) {
    /**
     * قانون پردازش بلوک شعر
     * @param {Object} state - وضعیت فعلی پردازشگر
     * @param {number} startLine - شماره خط شروع
     * @param {number} endLine - شماره خط پایان
     * @param {boolean} silent - اگر true باشد، فقط بررسی می‌کند
     * @returns {boolean} آیا الگو پیدا شد یا خیر
     */
    function poetry_rule(state, startLine, endLine, silent) {
        const startMarker = '...شعر';
        const endMarker = '...';

        let pos = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];
        let firstLine = state.src.slice(pos, max).trim();

        if (firstLine !== startMarker) return false;

        let nextLine = startLine;
        let foundEnd = false;
        let verses = [];

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

            if (currentLine === '') {
                verses.push({ type: 'separator' });
            } else {
                verses.push({ type: 'verse', content: currentLine });
            }
        }

        if (!foundEnd) return false;

        if (!silent) {
            let token;

            token = state.push('poetry_open', 'div', 1);
            token.attrs = [['class', 'poetry-container']];
            token.block = true;

            let currentStanza = [];

            for (let i = 0; i < verses.length; i++) {
                if (verses[i].type === 'separator') {
                    if (currentStanza.length > 0) {
                        renderStanza(state, currentStanza);
                        currentStanza = [];
                    }
                } else {
                    currentStanza.push(verses[i].content);
                }
            }

            if (currentStanza.length > 0) {
                renderStanza(state, currentStanza);
            }

            token = state.push('poetry_close', 'div', -1);
        }

        state.line = nextLine + 1;
        return true;
    }

    /**
     * رندر یک بیت شعر
     * @param {Object} state - وضعیت فعلی پردازشگر
     * @param {string[]} lines - آرایه مصرع‌های بیت
     */
    function renderStanza(state, lines) {
        let token;

        token = state.push('stanza_open', 'div', 1);
        token.attrs = [['class', 'poetry-stanza']];

        for (let line of lines) {
            token = state.push('verse_open', 'p', 1);
            token.attrs = [['class', 'poetry-verse']];

            token = state.push('inline', '', 0);
            token.content = line;
            token.children = [];

            token = state.push('verse_close', 'p', -1);
        }

        token = state.push('stanza_close', 'div', -1);
    }

    md.block.ruler.before('fence', 'poetry', poetry_rule);
}

module.exports = poetry_plugin;
