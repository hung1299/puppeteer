const handleFillImage = async (content, page) => {
    await page.evaluate(async (content) => {
        const img = new Image();
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");

        const setCanvasImage = (path, func) => {
            return new Promise((resolve) => {
                img.onload = function () {
                    c.width = this.naturalWidth;
                    c.height = this.naturalHeight;
                    ctx.drawImage(this, 0, 0);
                    c.toBlob((blob) => {
                        resolve(func(blob));
                    }, "image/png");
                };
                img.crossOrigin = "";
                img.src = path;
            });
        };

        await setCanvasImage(content.url, async (imgBlob) => {
            await navigator.clipboard
                .write([new ClipboardItem({ "image/png": imgBlob })])
                .then((e) => {
                    console.log("Image copied to clipboard");
                })
                .catch((e) => {
                    console.log(e);
                });
        });
        img.remove();
        c.remove();
    }, content);

    await page.keyboard.down("Control");
    await page.keyboard.press("v");
    await page.keyboard.up("Control");
    if (content.alt) {
        await page.waitForResponse(
            (response) =>
                response.status() === 200 &&
                response.url().includes("https://upload.wixmp.com/upload")
        );
        const dataImage = await page.$$("[data-hook='imageViewer']");
        await dataImage[dataImage.length - 1].click();
        await page.waitForTimeout(100);
        await page.$eval(
            "[data-hook='blockAlignmentAndSizeButton_sizeSmallCenter']",
            (elem) => elem.click()
        );
        await page.$eval("[data-hook='baseToolbarButton_settings']", (elem) =>
            elem.click()
        );
        await page.click("[data-hook=imageSettingsAltInput]");
        await page.keyboard.sendCharacter(content.alt);
        await page.click("[data-hook='actionButtonSave']");
        await dataImage[dataImage.length - 1].click();
    }
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
};

exports.handleFillImage = handleFillImage;
