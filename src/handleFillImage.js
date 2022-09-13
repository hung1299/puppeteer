const handleFillImage = async (url, page) => {
    await page.evaluate(async (url) => {
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
                img.src = path;
            });
        };

        await setCanvasImage(url, async (imgBlob) => {
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
    }, url);

    await page.keyboard.down("Control");
    await page.keyboard.press("v");
    await page.keyboard.up("Control");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
};

exports.handleFillImage = handleFillImage;
