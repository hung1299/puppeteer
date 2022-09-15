const { convert } = require("html-to-text");
const { LINK_TYPE, IMAGE_TYPE, TEXT_TYPE } = require("../utils/constant");

const parseHtml = (htmlContent) => {
    const text = convert(htmlContent, {
        wordwrap: false,
        preserveNewlines: true,
        formatters: {
            aBlockFormatter: function (elem, walk, builder, formatOptions) {
                builder.addInline("{");
                builder.addInline('"type":');
                builder.addInline(`"${LINK_TYPE}"`);
                builder.addInline(",");
                builder.addInline('"text":"');
                walk(elem.children, builder);
                builder.addInline('"');
                builder.addInline(",");
                builder.addInline('"url":');
                builder.addInline(`"${elem.attribs.href}"`);
                builder.addInline("}");
            },
            imgBlockFormatter: function (elem, walk, builder, formatOptions) {
                builder.addInline("{");
                builder.addInline('"type":');
                builder.addInline(`"${IMAGE_TYPE}"`);
                builder.addInline(",");
                builder.addInline('"data":');
                builder.addInline(`"${elem.attribs.src}"`);
                builder.addInline("}");
            },
        },
        selectors: [
            {
                selector: "a",
                format: "aBlockFormatter",
            },
            {
                selector: "img",
                format: "imgBlockFormatter",
            },
        ],
    });

    return text.split("\n").filter((str) => str.length > 0);
};

const formatHtmlString = (htmlContent) => {
    const HtmlString = parseHtml(htmlContent);
    const result = HtmlString.map((str) => {
        const arr = [];
        let text = "";
        let indexEnd = -1;
        for (let index = 0; index < str.length; index++) {
            if (index <= indexEnd) {
                continue;
            }
            if (str[index] === "{" || index === str.length - 1) {
                if (text !== "") {
                    arr.push({
                        type: TEXT_TYPE,
                        data: text,
                    });
                    text = "";
                }

                indexEnd = str.indexOf("}", index);
                if (indexEnd !== -1) {
                    arr.push(JSON.parse(str.slice(index, indexEnd + 1)));
                    continue;
                }
            }
            text += str[index];
        }
        return arr;
    });

    return result;
};

exports.formatHtmlString = formatHtmlString;
