/**
 * @fileoverview افزونه بازبینه‌ها (چک‌لیست) برای پارس‌نشان
 * @description این افزونه امکان ایجاد لیست‌های کار با چک‌باکس را فراهم می‌کند
 * @author پارس‌نشان
 * @license MIT
 */

/**
 * افزونه بازبینه‌ها (Task Lists)
 * 
 * این افزونه آیتم‌های لیست با فرمت [ ] یا [x] را به چک‌باکس تبدیل می‌کند
 * 
 * @example
 * // ورودی مارک‌داون:
 * // - [x] کار انجام‌شده
 * // - [ ] کار باقی‌مانده
 * //
 * // خروجی HTML شامل چک‌باکس‌های HTML می‌شود
 * 
 * @param {import('markdown-it')} md - نمونه markdown-it
 * @returns {void}
 */
function checklist_plugin(md) {
    md.core.ruler.after('inline', 'github-task-lists', function (state) {
        const tokens = state.tokens;
        for (let i = 2; i < tokens.length; i++) {
            if (isTodoItem(tokens, i)) {
                todoify(tokens[i], state.Token);
                tokens[i - 2].attrSet('class', 'task-list-item');
            }
        }
    });

    /**
     * بررسی اینکه آیا یک توکن آیتم بازبینه است یا خیر
     * @param {Array} tokens - آرایه توکن‌ها
     * @param {number} idx - اندیس توکن فعلی
     * @returns {boolean} آیا آیتم بازبینه است
     */
    function isTodoItem(tokens, idx) {
        return tokens[idx].type === 'inline' &&
            tokens[idx - 1].type === 'paragraph_open' &&
            tokens[idx - 2].type === 'list_item_open' &&
            (tokens[idx].content.startsWith('[ ] ') ||
                tokens[idx].content.startsWith('[x] ') ||
                tokens[idx].content.startsWith('[X] '));
    }

    /**
     * تبدیل توکن به چک‌باکس
     * @param {Object} token - توکن آیتم لیست
     * @param {Function} Token - سازنده توکن
     */
    function todoify(token, Token) {
        const isChecked = token.content.startsWith('[x] ') || token.content.startsWith('[X] ');
        token.content = token.content.substring(4);

        if (token.children && token.children.length > 0) {
            for (let i = 0; i < token.children.length; i++) {
                if (token.children[i].type === 'text') {
                    if (token.children[i].content.startsWith('[ ] ') ||
                        token.children[i].content.startsWith('[x] ') ||
                        token.children[i].content.startsWith('[X] ')) {
                        token.children[i].content = token.children[i].content.substring(4);
                    }
                    break;
                }
            }
        }

        const checkbox = new Token('html_inline', '', 0);
        checkbox.content = `<input type="checkbox" class="task-list-item-checkbox" disabled ${isChecked ? 'checked' : ''}> `;

        const spanOpen = new Token('html_inline', '', 0);
        spanOpen.content = '<span>';

        const spanClose = new Token('html_inline', '', 0);
        spanClose.content = '</span>';

        token.children.unshift(checkbox);
        token.children.splice(1, 0, spanOpen);
        token.children.push(spanClose);
    }
}

module.exports = checklist_plugin;
