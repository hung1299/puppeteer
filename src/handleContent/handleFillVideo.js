exports.handleFillVideo = async (TextItem, page) => {
    if (TextItem.text.indexOf("https://www.youtube.com/") === -1) {
        return false;
    }
    await Promise.all([
        page.click("[data-hook=composer-sidebar-item-add-elements]"),
        page.waitForNavigation(),
    ]);
    await page.waitForTimeout(1000);
    await Promise.all([
        page.click("[data-hook=composer-sidebar-VideoPlugin_InsertButton]"),
        page.waitForNavigation(),
    ]);
    await page.keyboard.sendCharacter(TextItem.text);
    await page.click("[data-hook=videoUploadModalAddButton]");
    const dataText = await page.$$("[data-editor='editor']");
    await dataText[dataText.length - 1].click();
    return true;
};
