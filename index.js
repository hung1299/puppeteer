const puppeteer = require("puppeteer");
const path = require("path");
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
                    "Takes 12 steps, but I hit a brick wall at 8. Took time off to recuperate and recover my energy. Now back from paradise, rejuvenated and ready to take on the beast again. All eyes on the prize, one more trip to deliver the coup de grace to that other beast in the west. Once that's done, its just a matter of time and protocol until the next step is reached. Its scary and new, but isn't that just what makes it all so deliciously exciting?",
                image: "https://cdn.searchenginejournal.com/wp-content/uploads/2022/06/image-search-1600-x-840-px-62c6dc4ff1eee-sej-1520x800.png",
            },
            {
                title: "Do Nots",
                content:
                    "Spurred on by my observations at work, I have come up with a list of things to avoid as a doctor in a hospital setting (especially for interns and medical students):",
                image: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dmlld3xlbnwwfHwwfHw%3D&w=1000&q=80",
            },
            {
                title: "Brighter Days Ahead",
                content:
                    "Resolution of conflicts on many fronts helps, but more is to come. Once we've jetted off east things will really start looking up. But until then: paint, parking, wood, tables, chairs, sardar, food, drink, lists, healthy doses of work and many more..",
                image: "https://images.ctfassets.net/hrltx12pl8hq/7yQR5uJhwEkRfjwMFJ7bUK/dc52a0913e8ff8b5c276177890eb0129/offset_comp_772626-opt.jpg?fit=fill&w=800&h=300",
            },
            {
                title: "Eureka!",
                content:
                    "I've always had a thing against Landon Donovan. The tag of 'best US soccer player of his generation' rang a bit hollow when you looked at what he's achieved on a global scale. His two aborted attempts at Bayer Leverkusen in Germany really frustrated me.",
                image: "https://www.w3schools.com/w3css/img_forest.jpg",
            },
            {
                title: "Good Point",
                content:
                    "Having a terrible morning all round today. Overworked and undervalued, I was sitting in the clinic and I locked myself in the room for half an hour to clear my thoughts before seeing any patients.",
                image: "https://h5p.org/sites/default/files/h5p/content/1209180/images/file-6113d5f8845dc.jpeg",
            },
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
    await page
        .waitForSelector("textarea[data-hook='post-form__title-input']")
        .then(async () => {
            await page.click("textarea[data-hook='post-form__title-input']");
            await page.keyboard.type(blog.title);
        });
    await page.click("[data-hook='post-form__content']");
    await page.keyboard.type(blog.content);
    await fillImage(blog.image, page);
    const submitBtn = await page.waitForSelector(
        "[data-hook='topbar-publish-button'][aria-disabled='false']",
        { timeout: 200000 }
    );
    await submitBtn.click();
    await page.waitForRequest((request) => {
        return request.method() === "PATCH";
    });
};

const fillImage = async (url, page) => {
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

const auto = async (user) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            `--user-data-dir=${path.resolve("./user-data/" + user.name)}`,
            "--disable-web-security",
            "--disable-features=IsolateOrigins",
            "--disable-site-isolation-trials",
        ],
        timeout: 100000,
    });
    console.log("get test");
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
    let index = 0;
    for (const blog of user.blogs) {
        try {
            await goToCreatePost(page, baseURL);
            await fillTitleAndContent(page, blog);
            index += 1;
            console.log("blog ", index);
        } catch (error) {
            console.log("something wrong with blog: ", blog);
            console.log("error: ", error.message);
        }
    }
    await goToBlogPosts(page, baseURL);
    await page.screenshot({
        path: `./images/${user.name}.png`,
        fullPage: true,
    });
    page.off("dialog");
    browser.close();
};

const main = async () => {
    console.log("START");
    for (const user of users) {
        try {
            await auto(user);
        } catch (error) {
            console.log("run fail with user: ", user.username);
            console.log("error: ", error);
        }
    }
    console.log("END");
};

main();
