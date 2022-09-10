const puppeteer = require("puppeteer");
const path = require("path");
const NETWORK_STATUS = "networkidle2";
const TEXT_TYPE = "text";
const IMAGE_TYPE = "image";
const LINK_TYPE = "link";

const users = [
    {
        name: "Test",
        username: "hx.test1999@gmail.com",
        password: "Binget1999",
        blogs: [
            {
                title: "Up Up and Away!",
                content: [
                    {
                        type: TEXT_TYPE,
                        data: "Takes 12 steps, but I hit a brick wall at 8. Took time off to recuperate and recover my energy. Now back from paradise, rejuvenated and ready to take on the beast again. All eyes on the prize, one more trip to deliver the coup de grace to that other beast in the west. Once that's done, its just a matter of time and protocol until the next step is reached. Its scary and new, but isn't that just what makes it all so deliciously exciting?",
                    },
                    {
                        type: IMAGE_TYPE,
                        data: "https://cdn.searchenginejournal.com/wp-content/uploads/2022/06/image-search-1600-x-840-px-62c6dc4ff1eee-sej-1520x800.png",
                    },
                    {
                        type: LINK_TYPE,
                        text: "google.com",
                        data: "https://www.google.com/search?q=edit+value+of+text+editor+js&sxsrf=ALiCzsbDcJo_1KeQNargcFXgggVHIhUXTg%3A1662778718228&ei=Xv0bY8jEDcjT2roPqu2YuAo&ved=0ahUKEwjI69u2nYn6AhXIqVYBHao2BqcQ4dUDCA8&uact=5&oq=edit+value+of+text+editor+js&gs_lcp=Cgdnd3Mtd2l6EAMyBQghEKABMgUIIRCgATIFCCEQoAEyBQghEKABMggIIRAeEBYQHTIICCEQHhAWEB0yCAghEB4QFhAdMggIIRAeEBYQHTIICCEQHhAWEB0yCAghEB4QFhAdOgoIABBHENYEELADOgoIIRAeEA8QFhAdSgUIPBIBMUoECEEYAEoECEYYAFDOBFj1B2DuCGgBcAF4AIABeYgB8QGSAQMwLjKYAQCgAQHIAQjAAQE&sclient=gws-wiz#bsht=CgRmYnNtEgYIBBAAGBE",
                    },
                ],
            },
            // {
            //     title: "Do Nots",
            //     content: [
            //         {
            //             type: TEXT_TYPE,
            //             data: "Spurred on by my observations at work, I have come up with a list of things to avoid as a doctor in a hospital setting (especially for interns and medical students):",
            //         },
            //         {
            //             type: IMAGE_TYPE,
            //             data: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dmlld3xlbnwwfHwwfHw%3D&w=1000&q=80",
            //         },
            //         {
            //             type: LINK_TYPE,
            //             data: "https://www.google.com/search?q=edit+value+of+text+editor+js&sxsrf=ALiCzsbDcJo_1KeQNargcFXgggVHIhUXTg%3A1662778718228&ei=Xv0bY8jEDcjT2roPqu2YuAo&ved=0ahUKEwjI69u2nYn6AhXIqVYBHao2BqcQ4dUDCA8&uact=5&oq=edit+value+of+text+editor+js&gs_lcp=Cgdnd3Mtd2l6EAMyBQghEKABMgUIIRCgATIFCCEQoAEyBQghEKABMggIIRAeEBYQHTIICCEQHhAWEB0yCAghEB4QFhAdMggIIRAeEBYQHTIICCEQHhAWEB0yCAghEB4QFhAdOgoIABBHENYEELADOgoIIRAeEA8QFhAdSgUIPBIBMUoECEEYAEoECEYYAFDOBFj1B2DuCGgBcAF4AIABeYgB8QGSAQMwLjKYAQCgAQHIAQjAAQE&sclient=gws-wiz#bsht=CgRmYnNtEgYIBBAAGBE",
            //         },
            //     ],
            // },
            // {
            //     title: "Brighter Days Ahead",
            //     content: [
            //         {
            //             type: TEXT_TYPE,
            //             data: "Resolution of conflicts on many fronts helps, but more is to come. Once we've jetted off east things will really start looking up. But until then: paint, parking, wood, tables, chairs, sardar, food, drink, lists, healthy doses of work and many more..",
            //         },
            //         {
            //             type: IMAGE_TYPE,
            //             data: "https://images.ctfassets.net/hrltx12pl8hq/7yQR5uJhwEkRfjwMFJ7bUK/dc52a0913e8ff8b5c276177890eb0129/offset_comp_772626-opt.jpg?fit=fill&w=800&h=300",
            //         },
            //         {
            //             type: LINK_TYPE,
            //             data: "https://images.ctfassets.net/hrltx12pl8hq/7yQR5uJhwEkRfjwMFJ7bUK/dc52a0913e8ff8b5c276177890eb0129/offset_comp_772626-opt.jpg?fit=fill&w=800&h=300",
            //         },
            //     ],
            // },
            // {
            //     title: "Eureka!",
            //     content: [
            //         {
            //             type: TEXT_TYPE,
            //             data: "I've always had a thing against Landon Donovan. The tag of 'best US soccer player of his generation' rang a bit hollow when you looked at what he's achieved on a global scale. His two aborted attempts at Bayer Leverkusen in Germany really frustrated me.",
            //         },
            //         {
            //             type: IMAGE_TYPE,
            //             data: "https://www.w3schools.com/w3css/img_forest.jpg",
            //         },
            //         {
            //             type: LINK_TYPE,
            //             data: "https://www.w3schools.com/w3css/img_forest.jpg",
            //         },
            //     ],
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

const handleFillContent = async (content, page) => {
    switch (content.type) {
        case TEXT_TYPE:
            await page.keyboard.type(content.data);
            await page.keyboard.press("Enter");
            break;
        case IMAGE_TYPE:
            await fillImage(content.data, page);
            break;
        case LINK_TYPE:
            await page.keyboard.type(content.data);
            await page.keyboard.press("Enter");
            break;
        default:
            break;
    }
};

const fillTitleAndContent = async (page, blog) => {
    await page
        .waitForSelector("textarea[data-hook='post-form__title-input']")
        .then(async () => {
            await page.click("textarea[data-hook='post-form__title-input']");
            await page.keyboard.type(blog.title);
        });
    await page.click("[data-hook='post-form__content']");
    for (const data of blog.content) {
        await handleFillContent(data, page);
    }
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

const fillLink = async(link);

const auto = async (user) => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--user-data-dir=${path.resolve("./user-data/" + user.name)}`,
            "--disable-web-security",
            "--disable-features=IsolateOrigins",
            "--disable-site-isolation-trials",
        ],
        timeout: 100000,
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
    let index = 0;
    for (const blog of user.blogs) {
        try {
            await goToCreatePost(page, baseURL);
            await fillTitleAndContent(page, blog);
            index += 1;
            console.log("blog ", index);
        } catch (error) {
            console.log("something wrong with blog: ", blog);
            console.log("error: ", error);
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
