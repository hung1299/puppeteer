const puppeteer = require("puppeteer");
const axios = require("axios");
const NETWORK_STATUS = "networkidle2";

const users = [
    {
        name: "Test",
        username: "hx.test1999@gmail.com",
        password: "Binget1999",
        blogs: [
            {
                title: "Up Up and Away!",
                content:
                    "Took the plunge. Dealing with the fall-out. About to secure my freedom from the evil tentacled monster. Takes 12 steps, but I hit a brick wall at 8. Took time off to recuperate and recover my energy. Now back from paradise, rejuvenated and ready to take on the beast again. All eyes on the prize, one more trip to deliver the coup de grace to that other beast in the west. Once that's done, its just a matter of time and protocol until the next step is reached. Its scary and new, but isn't that just what makes it all so deliciously exciting?",
                image: "https://www.w3schools.com/w3css/img_lights.jpg",
            },
            // {
            //     title: "Do Nots",
            //     content:
            //         "Spurred on by my observations at work, I have come up with a list of things to avoid as a doctor in a hospital setting (especially for interns and medical students):",
            // },
            // {
            //     title: "Brighter Days Ahead",
            //     content:
            //         "Resolution of conflicts on many fronts helps, but more is to come. Once we've jetted off east things will really start looking up. But until then: paint, parking, wood, tables, chairs, sardar, food, drink, lists, healthy doses of work and many more..",
            // },
            // {
            //     title: "Eureka!",
            //     content:
            //         "I've always had a thing against Landon Donovan. The tag of 'best US soccer player of his generation' rang a bit hollow when you looked at what he's achieved on a global scale. His two aborted attempts at Bayer Leverkusen in Germany really frustrated me.",
            // },
            // {
            //     title: "Good Point",
            //     content:
            //         "Having a terrible morning all round today. Overworked and undervalued, I was sitting in the clinic and I locked myself in the room for half an hour to clear my thoughts before seeing any patients.",
            // },
        ],
    },
];

const getPage = async (browser, page) => {
    const LIMIT_DOMSIZE = 500;
    try {
        let domSize = (await page.content()).length;
        if (domSize > LIMIT_DOMSIZE) {
            return page;
        }
    } catch (e) {}

    const pagesList = await browser.pages();
    const pagesListLength = pagesList.length;
    if (pagesListLength > 0) {
        try {
            let domSize = (await pagesListLength[0].content()).length;
            if (domSize > LIMIT_DOMSIZE) {
                return pagesListLength[0];
            }
        } catch (e) {}
    }
    return page;
};

const getBaseURL = async (page) => {
    const blogUrl = page.url();
    const index = blogUrl.indexOf("?");
    return blogUrl.slice(0, index) + "/blog/";
};

const goToBlogPosts = async (page, baseURL) => {
    const blogUrl = baseURL + "posts";
    await page.goto(blogUrl, {
        waitUntil: NETWORK_STATUS,
    });
};

const goToCreatePost = async (page, baseURL) => {
    const blogUrl = baseURL + "create-post";
    await page.goto(blogUrl, {
        waitUntil: NETWORK_STATUS,
    });
};

const fillTitleAndContent = async (page, blog) => {
    await page.type("textarea[data-hook='post-form__title-input']", blog.title);
    await page.click("[data-hook='post-form__content']");
    await page.keyboard.type(blog.content);
    await getImageToClipBoard(blog.image, page);
    await page.keyboard.down("Control");
    await page.keyboard.press("v");
    await page.keyboard.up("Control");
    await page.keyboard.press("Enter");
    const submitBtn = await page.waitForSelector(
        "[data-hook='topbar-publish-button'][aria-disabled='false']"
    );
    await submitBtn.click();
};

const getImageToClipBoard = async (url, page) => {
    let { data } = await axios.get(url, { responseType: "blob" });

    await page.evaluate(async (data) => {
        const type = "image/png";
        // const blob = new Blob([data], "image/png");
        const image = [new ClipboardItem({ [type]: data })];
        await navigator.clipboard.write(image);
    }, data);
};

const auto = async (user) => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [`--user-data-dir=./user-data/${user.name}`],
    });
    let page = await browser.newPage();
    page.on("dialog", async (dialog) => {
        await dialog.accept();
    });
    const tabs = await browser.pages();
    await tabs[0].close();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto("https://manage.wix.com/account/sites", {
        waitUntil: NETWORK_STATUS,
    });
    const sitesData = await page.$$("div[data-hook=site-list-item]");
    for (const site of sitesData) {
        const name = await site.$eval(
            "span[data-hook=site-list-item-name]",
            (e) => e.textContent
        );
        if (user.name === name) {
            await site.click();
            page = await getPage(browser, page);
            break;
        }
    }
    const baseURL = await getBaseURL(page);
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(baseURL, [
        "clipboard-read",
        "clipboard-write",
        "clipboard-sanitized-write",
    ]);
    let index = 0;
    for (const blog of user.blogs) {
        await goToCreatePost(page, baseURL);
        await fillTitleAndContent(page, blog);
        index += 1;
        console.log("blog ", index);
    }
    // await goToBlogPosts(page, baseURL);
    await page.screenshot({
        path: `./images/${user.name}.png`,
        fullPage: true,
    });
    page.off("dialog");
    // browser.close();
};

const main = async () => {
    console.log("START");
    try {
        for (const user of users) {
            await auto(user);
        }
    } catch (error) {
        console.log("error", error);
    }
    console.log("END");
};

main();