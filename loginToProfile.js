const puppeteer = require("puppeteer");
const { NETWORK_STATUS } = require("./src/utils/constant");
const PATH = __dirname;

const main = async () => {
    const profileName = process.argv[2];
    if (!profileName) {
        console.log("Thieu ten profile");
        return;
    }
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--user-data-dir=${PATH}/user-data/${profileName}`,
            "--disable-web-security",
            "--disable-features=IsolateOrigins",
            "--disable-site-isolation-trials",
        ],
        timeout: 100000,
        defaultViewport: null,
    });
    let page = (await browser.pages())[0];
    page.on("dialog", async (dialog) => {
        await dialog.accept();
    });
    await page.goto("https://manage.wix.com/account/sites", {
        waitUntil: NETWORK_STATUS,
    });

    await page.waitForTimeout(1000000);
    page.off("dialog");
    browser.close();
    return;
};

main();
