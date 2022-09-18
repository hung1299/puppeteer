const {
    H2_TYPE,
    H3_TYPE,
    H4_TYPE,
    H5_TYPE,
    H6_TYPE,
    PARAGRAPH_TYPE,
} = require("../utils/constant");
const { handleFillVideo } = require("./handleFillVideo");

const handleFillText = async (TextItem, page) => {
    const result = await handleFillVideo(TextItem, page);
    if (result) {
        return;
    }
    await page.keyboard.sendCharacter(TextItem.text);
    if (TextItem.type === PARAGRAPH_TYPE) {
        await page.keyboard.press("Space");
        return;
    }
    await page.waitForSelector("[data-hook='LinkButton']").then(async () => {
        await page.click("[data-hook=headingsDropdownButton]");
        await page.waitForTimeout(10);
        const options = await page.$$("._16tLz");
        switch (TextItem.type) {
            case H2_TYPE:
                await options[0].click();
                break;
            case H3_TYPE:
                await options[1].click();
                break;
            case H4_TYPE:
                await options[2].click();
                break;
            case H5_TYPE:
                await options[3].click();
                break;
            case H6_TYPE:
                await options[4].click();
                break;
            default:
                break;
        }
        const dataText = await page.$$("[data-text='true']");
        await dataText[dataText.length - 1].click();
        const NUMBER_OF_KEY_PRESS = 10;
        for (const x in [...Array(NUMBER_OF_KEY_PRESS).keys()]) {
            await page.keyboard.press("ArrowDown");
        }
        await page.keyboard.press("Enter");
        await page.keyboard.press("Backspace");
    });
};

exports.handleFillText = handleFillText;
