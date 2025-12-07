/**
 * پارس‌نشان - مفسر مارک‌داون فارسی
 * نسخه: ۱.۱.۰
 * مجوز: MIT
 * 
 * این فایل bundle شده برای استفاده مستقیم در مرورگر است.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['markdown-it'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node.js/CommonJS - به src/index.js هدایت می‌شود
    module.exports = require('./src/index.js');
  } else {
    // مرورگر (Global)
    root.createParsNeshan = factory(root.markdownit);
  }
}(typeof self !== 'undefined' ? self : this, function (markdownit) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // پلاگین هایلایت متن (==text==)
  // ═══════════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════════
  // پلاگین جعبه‌های توضیحی (admonitions)
  // ═══════════════════════════════════════════════════════════════════════════
  function admonition_plugin(md) {
    const types = {
      'هشدار': { class: 'warning', title: 'هشدار' },
      'توجه': { class: 'note', title: 'توجه' },
      'نکته': { class: 'tip', title: 'نکته' },
      'مهم': { class: 'important', title: 'مهم' },
      'احتیاط': { class: 'caution', title: 'احتیاط' }
    };

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

  // ═══════════════════════════════════════════════════════════════════════════
  // پلاگین بازبینه‌ها (task lists)
  // ═══════════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════════
  // پلاگین پشتیبانی از اعداد فارسی در لیست‌های مرتب
  // ═══════════════════════════════════════════════════════════════════════════
  function persian_ordered_list_plugin(md) {
    function convertPersianToArabicNumbers(str) {
      const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
      const arabicNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      for (let i = 0; i < 10; i++) {
        str = str.replace(persianNumbers[i], arabicNumbers[i]);
      }
      return str;
    }

    function persian_list_translator(state) {
      const regex = /^(\s*)([۰-۹]+)\. /gm;
      state.src = state.src.replace(regex, (match, indentation, persianNumber) => {
        const englishNumber = convertPersianToArabicNumbers(persianNumber);
        return `${indentation}${englishNumber}. `;
      });
    }

    md.core.ruler.before('block', 'persian_ordered_list', persian_list_translator);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // پلاگین نمایش شعر
  // ═══════════════════════════════════════════════════════════════════════════
  function poetry_plugin(md) {
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

  // ═══════════════════════════════════════════════════════════════════════════
  // پلاگین تشخیص خودکار جهت متن
  // ═══════════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════════
  // تابع اصلی createParsNeshan
  // ═══════════════════════════════════════════════════════════════════════════
  function createParsNeshan(options = {}) {
    const { plugins = [], ...mdOptions } = options;

    if (typeof markdownit !== 'function') {
      throw new Error('پارس‌نشان: کتابخانه markdown-it یافت نشد. لطفاً ابتدا آن را بارگذاری کنید.');
    }

    const md = markdownit({
      html: true,
      ...mdOptions
    });

    md.use(highlight_plugin);
    md.use(admonition_plugin);
    md.use(checklist_plugin);
    md.use(persian_ordered_list_plugin);
    md.use(poetry_plugin);
    md.use(auto_direction_plugin);

    plugins.forEach(pluginConfig => {
      if (Array.isArray(pluginConfig)) {
        md.use(...pluginConfig);
      } else {
        md.use(pluginConfig);
      }
    });

    return md;
  }

  return createParsNeshan;
}));