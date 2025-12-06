/**
 * پلاگین بازبینه‌ها (task lists)
 * @param {Object} md - نمونه markdown-it
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

    function isTodoItem(tokens, idx) {
        return tokens[idx].type === 'inline' &&
            tokens[idx - 1].type === 'paragraph_open' &&
            tokens[idx - 2].type === 'list_item_open' &&
            (tokens[idx].content.startsWith('[ ] ') ||
                tokens[idx].content.startsWith('[x] ') ||
                tokens[idx].content.startsWith('[X] '));
    }

    function todoify(token, Token) {
        const isChecked = token.content.startsWith('[x] ') || token.content.startsWith('[X] ');

        // حذف '[ ] ' یا '[x] ' از محتوای اصلی
        token.content = token.content.substring(4);

        // اگر توکن‌های فرزند وجود دارند، باید اولین توکن text را هم اصلاح کنیم
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

        // ایجاد چک‌باکس
        const checkbox = new Token('html_inline', '', 0);
        checkbox.content = `<input type="checkbox" class="task-list-item-checkbox" disabled ${isChecked ? 'checked' : ''}> `;

        // ایجاد span برای احاطه کردن متن
        const spanOpen = new Token('html_inline', '', 0);
        spanOpen.content = '<span>';

        const spanClose = new Token('html_inline', '', 0);
        spanClose.content = '</span>';

        // اضافه کردن چک‌باکس به ابتدا
        token.children.unshift(checkbox);

        // احاطه کردن بقیه محتوا با span
        token.children.splice(1, 0, spanOpen);
        token.children.push(spanClose);
    }
}

module.exports = checklist_plugin;
