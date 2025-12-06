/**
 * پلاگین تشخیص خودکار جهت متن
 * @param {Object} md - نمونه markdown-it
 */
function auto_direction_plugin(md) {
    function detectDirection(text) {
        const rtlRegex = /[\u0600-\u06FF]/;
        const ltrRegex = /[a-zA-Z]/;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (rtlRegex.test(char)) return 'rtl';
            if (ltrRegex.test(char)) return 'ltr';
        }
        return 'rtl';
    }

    // لیستی از تگ‌های بلوکی که می‌خواهیم جهت‌شان را تنظیم کنیم
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

            // منطق پیدا کردن محتوا برای هر نوع تگ
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
