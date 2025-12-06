/**
 * پلاگین جعبه‌های توضیحی (admonitions)
 * @param {Object} md - نمونه markdown-it
 */
function admonition_plugin(md) {
    const types = {
        'هشدار': {
            class: 'warning',
            title: 'هشدار'
        },
        'توجه': {
            class: 'note',
            title: 'توجه'
        },
        'نکته': {
            class: 'tip',
            title: 'نکته'
        },
        'مهم': {
            class: 'important',
            title: 'مهم'
        },
        'احتیاط': {
            class: 'caution',
            title: 'احتیاط'
        }
    };

    function admonition_rule(state, startLine, endLine, silent) {
        const startMarker = '...';
        const endMarker = '...';

        // ۱. بررسی خط شروع
        let pos = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];
        let firstLine = state.src.slice(pos, max);

        if (!firstLine.startsWith(startMarker)) {
            return false;
        }

        const keyword = firstLine.substring(startMarker.length).trim();
        if (!types[keyword]) {
            return false;
        }

        // ۲. پیدا کردن خط پایان
        let nextLine = startLine;
        let foundEnd = false;

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
        }

        if (!foundEnd) {
            return false;
        }

        // ۳. ساختن توکن‌ها
        if (!silent) {
            const type = types[keyword];
            let token;

            // باز کردن تگ div
            token = state.push('admonition_open', 'div', 1);
            token.attrs = [
                ['class', `admonition ${type.class}`]
            ];
            token.block = true;

            // افزودن عنوان
            token = state.push('admonition_title_open', 'p', 1);
            token.attrs = [
                ['class', 'admonition-title']
            ];
            token = state.push('text', '', 0);
            token.content = type.title;
            token = state.push('admonition_title_close', 'p', -1);

            // رندر کردن محتوای داخل جعبه
            const contentToRender = state.src.slice(state.bMarks[startLine + 1], state.bMarks[nextLine]);
            state.md.block.parse(contentToRender, state.md, state.env, state.tokens);

            // بستن تگ div
            token = state.push('admonition_close', 'div', -1);
        }

        state.line = nextLine + 1;
        return true;
    }

    md.block.ruler.before('fence', 'admonition', admonition_rule);
}

module.exports = admonition_plugin;
