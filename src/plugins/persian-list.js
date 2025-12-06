/**
 * پلاگین پشتیبانی از اعداد فارسی در لیست‌های مرتب
 * @param {Object} md - نمونه markdown-it
 */
function persian_ordered_list_plugin(md) {
    // تابع کمکی برای تبدیل اعداد فارسی به انگلیسی
    function convertPersianToArabicNumbers(str) {
        const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
        const arabicNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        for (let i = 0; i < 10; i++) {
            str = str.replace(persianNumbers[i], arabicNumbers[i]);
        }
        return str;
    }

    // قانون هسته‌ای که قبل از پردازش بلوک‌ها اجرا می‌شود
    function persian_list_translator(state) {
        // الگوی ما: (شروع خط)(چند فاصله)(عدد فارسی)(نقطه)(فاصله)
        const regex = /^(\s*)([۰-۹]+)(\.\\s)/gm;

        state.src = state.src.replace(regex, (match, indentation, persianNumber, rest) => {
            const englishNumber = convertPersianToArabicNumbers(persianNumber);
            return `${indentation}${englishNumber}${rest}`;
        });
    }

    md.core.ruler.before('block', 'persian_ordered_list', persian_list_translator);
}

module.exports = persian_ordered_list_plugin;
