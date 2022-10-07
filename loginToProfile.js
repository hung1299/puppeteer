const puppeteer = require("puppeteer");
const fs = require("fs");
const { NETWORK_STATUS } = require("./src/utils/constant");
const PATH = __dirname;

const main = async () => {
    const profileName = process.argv[2];
    const isFillLink = process.argv[3] ? false : true;
    if (!profileName) {
        console.log("Thieu ten profile");
        return;
    }
    if(!isFillLink){
        await page.waitForTimeout(2000000);
        return;
    }
    const rawData = fs.readFileSync(`${PATH}/src/data/profile.json`);
    let profiles = JSON.parse(rawData);
    const { username, password } = profiles[profileName];
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--user-data-dir=${PATH}/user-data/${profileName}`,
            "--disable-web-security",
            "--disable-features=IsolateOrigins",
            "--disable-site-isolation-trials",
        ],
        defaultViewport: null,
    });
    let page = (await browser.pages())[0];
    page.on("dialog", async (dialog) => {
        await dialog.accept();
    });
    await page.goto("https://manage.wix.com/account/sites", {
        waitUntil: NETWORK_STATUS,
    });
    if (username && password && isFillLink) {
        await page.waitForSelector("input[name=email]").then(async () => {
            await page.click("input[name=email]");
            await page.keyboard.sendCharacter(username);
        });
        await page.click("button[name=submit]");
        await page.waitForSelector("input[name=password]").then(async () => {
            await page.click("input[name=password]");
            await page.keyboard.sendCharacter(password);
        });
        await Promise.all([
            page.click("button[name=submit]"),
            page.waitForNavigation({
                timeout: 1000000,
                waitUntil: NETWORK_STATUS,
            }),
            page.waitForResponse((response) => response.url() === "https://manage.wix.com/_api/wix-user-preferences-webapp/set")
        ])
    }
    
    console.log("Login success");
    page.off("dialog");
    browser.close();
    return;
};;

main();
