const handleFillLink = async (linkItem, page) => {
    await page.keyboard.sendCharacter(linkItem.text);
    await page.evaluate(async (linkItem) => {
        const dataText = document.querySelectorAll("[data-text='true']");
        if (dataText.length <= 0) {
            return;
        }
        const textNode = dataText[dataText.length - 1].childNodes[0];
        const text = linkItem.text;

        const range = document.createRange();
        const selection = window.getSelection();
        const startIndex = textNode.wholeText.lastIndexOf(text);
        const endIndex = startIndex + text.length;

        range.setStart(textNode, startIndex);
        range.setEnd(textNode, endIndex);

        selection.removeAllRanges();
        selection.addRange(range);
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
