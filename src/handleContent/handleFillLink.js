const { addRangeToText } = require("./addRangeToText");

const handleFillLink = async (linkItem, page) => {
    await page.keyboard.sendCharacter(linkItem.text);
    await page.evaluate(async (linkItem) => {
        const dataText = document.querySelectorAll("[data-text='true']");
        if (dataText.length <= 0) {
            return;
        }
        const textNode = dataText[dataText.length - 1].childNodes[0];

        addRangeToText({ document, window, textNode, text: linkItem.text });
    }, linkItem);

    await page.waitForSelector("[data-hook='LinkButton']").then(async () => {
        await page.click("[data-hook=LinkButton]");
        await page.keyboard.sendCharacter(linkItem.url);
        await page.click("[data-hook='actionButtonSave']");
    });

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
};

exports.handleFillLink = handleFillLink;
