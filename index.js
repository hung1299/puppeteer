const puppeteer = require("puppeteer");

const users = [
    {
        name: "test",
        username: "hx.test1999@gmail.com",
        password: "Binget1999"
    }
]

const auto = async () => {
    // const browser = await puppeteer.launch({
    //     args: ["--user-data-dir="]
    // });
    const browser = await puppeteer.launch({
        headless: false,
        args: [`--user-data-dir=./user-data/${users[0].name}`]
    })
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768});
    await page.goto("https://wix.com", {waitUntil: 'networkidle2'});
    await page.waitForTimeout(1000)
    // const sitesData = await page.waitForSelector('[data-hook=site-list-item]')
    const sitesData = await page.waitForSelector('.Ax+I8')
    // const sitesData = await page.evaluate(() => {
    //     // const sites = document.querySelectorAll(`div[data-hook="site-list-item"]`)
    //     // const sites = document.querySelectorAll('[data-hook=site-list-item]')
    //     const sites = document.querySelectorAll('div')
    //     console.log(sites);
    //     const test = 1  + 23 + 3;
        
    //     return test;
    // })
    console.log(sitesData);
}


try {
    auto()
} catch (error) {
    console.log(error);
}