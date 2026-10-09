/*
turned the following into a simple python method: https://stackoverflow.com/a/39452138
and then converted to js for this project

default setting is red text to make printing error messages quick
*/

export function prettyText(
    text,
    {
        color = "red",
        bg = false,
        bold = false,
        italic = false,
        underline = false,
        blink = false,
        bright = false,
    } = {}
) {
    const codes = {

        bold: 1,
        italic: 3,
        underline: 4,
        blink: 5,
        blink2: 6,
        not_blink: 25,
        selected: 7,

        black: 30,
        red: 31,
        green: 32,
        yellow: 33,
        blue: 34,
        violet: 35,
        beige: 36,
        white: 37,
        grey: 90,

        bg_black: 40,
        bg_red: 41,
        bg_green: 42,
        bg_yellow: 43,
        bg_blue: 44,
        bg_violet: 45,
        bg_beige: 46,
        bg_white: 47,
        bg_grey: 100,

        red_bright: 91,
        green_bright: 92,
        yellow_bright: 93,
        blue_bright: 94,
        violet_bright: 95,
        beige_bright: 96,
        white_bright: 97,
        black_bright: 30,

        bg_black_bright: 40,
        bg_grey_bright: 100,
        bg_red_bright: 101,
        bg_green_bright: 102,
        bg_yellow_bright: 103,
        bg_blue_bright: 104,
        bg_violet_bright: 105,
        bg_beige_bright: 106,
        bg_white_bright: 107,
    };

    const styles = [];

    if (italic) styles.push(codes.italic);
    if (bold) styles.push(codes.bold);
    if (underline) styles.push(codes.underline);

    styles.push(
        blink ? codes.blink : codes.not_blink
    );

    if (bg !== false) {
        const bgKey = `bg_${bg.toLowerCase()}${bright ? "_bright" : ""}`;
        styles.push(codes[bgKey] ?? codes[`bg_${bg.toLowerCase()}`] ?? "");
    }

    const colorKey = `${color.toLowerCase()}${bright ? "_bright" : ""}`;
    styles.push(codes[colorKey] ?? codes[color.toLowerCase()] ?? "");

    if (styles.length === 0) return String(text);
    return `\x1b[${styles.join(";")}m${text}\x1b[0m`;
}