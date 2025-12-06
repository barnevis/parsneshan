/**
 * پلاگین هایلایت متن (==text==)
 * @param {Object} md - نمونه markdown-it
 */
function highlight_plugin(md) {
    function highlight_rule(state, silent) {
        let start = state.pos;
        if (state.src.charCodeAt(start) !== 0x3D /* = */ || state.src.charCodeAt(start + 1) !== 0x3D /* = */) {
            return false;
        }
        let max = state.posMax;
        let pos = start + 2;
        while (pos < max) {
            if (state.src.charCodeAt(pos) === 0x3D /* = */ && state.src.charCodeAt(pos + 1) === 0x3D /* = */) {
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
