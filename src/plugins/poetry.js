/**
 * پلاگین نمایش شعر
 * @param {Object} md - نمونه markdown-it
 */
function poetry_plugin(md) {
    function poetry_rule(state, startLine, endLine, silent) {
        const startMarker = '...شعر';
        const endMarker = '...';

        // بررسی خط شروع
        let pos = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];
        let firstLine = state.src.slice(pos, max).trim();

        if (firstLine !== startMarker) {
            return false;
        }

        // پیدا کردن خط پایان
        let nextLine = startLine;
        let foundEnd = false;
        let verses = [];

        while (nextLine < endLine) {
            nextLine++;
            if (nextLine >= endLine) {
                break;
            }

            pos = state.bMarks[nextLine] + state.tShift[nextLine];
            max = state.eMarks[nextLine];
            let currentLine = state.src.slice(pos, max).trim();

            if (currentLine === endMarker) {
                foundEnd = true;
                break;
            }

            // جمع‌آوری ابیات
            if (currentLine === '') {
                verses.push({
                    type: 'separator'
                });
            } else {
                verses.push({
                    type: 'verse',
                    content: currentLine
                });
            }
        }

        if (!foundEnd) {
            return false;
        }

        // ساختن توکن‌ها
        if (!silent) {
            let token;

            // باز کردن تگ div برای شعر
            token = state.push('poetry_open', 'div', 1);
            token.attrs = [
                ['class', 'poetry-container']
            ];
            token.block = true;

            // پردازش ابیات
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

            // رندر آخرین بیت
            if (currentStanza.length > 0) {
                renderStanza(state, currentStanza);
            }

            // بستن تگ div
            token = state.push('poetry_close', 'div', -1);
        }

        state.line = nextLine + 1;
        return true;
    }

    function renderStanza(state, lines) {
        let token;

        // باز کردن div برای هر بیت
        token = state.push('stanza_open', 'div', 1);
        token.attrs = [
            ['class', 'poetry-stanza']
        ];

        // رندر هر مصرع
        for (let line of lines) {
            token = state.push('verse_open', 'p', 1);
            token.attrs = [
                ['class', 'poetry-verse']
            ];

            // اجازه می‌دهیم markdown-it محتوای inline را پردازش کند
            token = state.push('inline', '', 0);
            token.content = line;
            token.children = [];

            token = state.push('verse_close', 'p', -1);
        }

        // بستن div بیت
        token = state.push('stanza_close', 'div', -1);
    }

    md.block.ruler.before('fence', 'poetry', poetry_rule);
}

module.exports = poetry_plugin;
