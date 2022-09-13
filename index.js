const puppeteer = require("puppeteer");
const fs = require("fs");
const { handleFillImage } = require("./src/handleFillImage");
const { handleFillLink } = require("./src/handleFillLink");
const {
    TEXT_TYPE,
    LINK_TYPE,
    IMAGE_TYPE,
    NETWORK_STATUS,
    BASE_URL,
} = require("./src/utils/constant");
const {
    getAbsoluteUrl,
    getBaseBlogURL,
    getPageContext,
    goToPageWithUrl,
    groupBy,
} = require("./src/utils/utils");
const { formatHtmlString } = require("./src/parseHtmlContent");
const { callApi } = require("./src/api");

const handleFillContent = async (content, page) => {
    switch (content.type) {
        case TEXT_TYPE:
            await page.keyboard.sendCharacter(content.data);
            await page.keyboard.press("Space");
            break;
        case LINK_TYPE:
            await handleFillLink(content, page);
            break;
        case IMAGE_TYPE:
            await handleFillImage(content.data, page);
            break;
        default:
            break;
    }
};

const updatePost = async (page, post) => {
    await page
        .waitForSelector("textarea[data-hook='post-form__title-input']")
        .then(async () => {
            await page.click("textarea[data-hook='post-form__title-input']");
            await page.keyboard.down("Control");
            await page.keyboard.press("a");
            await page.keyboard.up("Control");
            await page.keyboard.press("Delete");
        });

    await page.click("[data-hook='post-form__content']");
    await page.keyboard.down("Control");
    await page.keyboard.press("a");
    await page.keyboard.up("Control");
    await page.keyboard.press("Delete");

    await createPost(page, post);
};

const createPost = async (page, post, isPageIdNull = false) => {
    await page
        .waitForSelector("textarea[data-hook='post-form__title-input']")
        .then(async () => {
            await page.click("textarea[data-hook='post-form__title-input']");
            await page.keyboard.sendCharacter(post.post_title);
        });
    const pageContent = formatHtmlString(post.post_content);
    await page.click("[data-hook='post-form__content']");
    for (const content of pageContent) {
        for (const data of content) {
            await handleFillContent(data, page);
        }
        await page.keyboard.press("Enter");
    }
    const submitBtn = await page.waitForSelector(
        "[data-hook='topbar-publish-button'][aria-disabled='false']",
        { timeout: 200000 }
    );
    if (isPageIdNull) {
        const url = page.url();
        const start = url.indexOf("blog");
        const end = url.indexOf("/edit");
        const post_wix_id = url.slice(start + 5, end);
        const result = await callApi({
            url: "/wp-json/v1/save-wix-data",
            baseURl: BASE_URL,
            params: {
                ID: post.ID,
                field: "post_wix_id",
                fieldData: post_wix_id,
            },
        });
        // console.log(result);
    }
    await Promise.all([submitBtn.click(), page.waitForNavigation()]);
};

const auto = async (profile) => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--user-data-dir=${getAbsoluteUrl(
                "./user-data/" + profile.cmsCategory
            )}`,
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
    const sitesData = await page.$$("div[data-hook=site-list-item]");
    for (const site of sitesData) {
        const name = await site.$eval(
            "span[data-hook=site-list-item-name]",
            (e) => e.textContent
        );
        if (profile.cmsCategory === name) {
            await site.click();
            page = await getPageContext(browser, page);
            break;
        }
    }
    const baseURL = await getBaseBlogURL(page);
    await goToPageWithUrl(page, baseURL + "posts");
    const listPostsId = await page.$$eval("tr[data-hook]", (nodes) =>
        nodes.map((node) => {
            const text = node.getAttribute("data-hook");
            return text.slice(text.indexOf("item-") + 5);
        })
    );
    const MAX_PAGE_HANDLE = 2;

    for (let i = 0; i < profile.posts.length; i += MAX_PAGE_HANDLE) {
        const requests = profile.posts
            .slice(i, i + MAX_PAGE_HANDLE)
            .map(async (post) => {
                const pageContext = await browser.newPage();
                try {
                    if (
                        post.post_wix_id &&
                        listPostsId.indexOf(post.post_wix_id) > -1
                    ) {
                        await goToPageWithUrl(
                            pageContext,
                            baseURL + post.post_wix_id + "/edit"
                        );
                        await updatePost(pageContext, post);
                    } else {
                        await goToPageWithUrl(
                            pageContext,
                            baseURL + "create-post"
                        );
                        await createPost(pageContext, post, true);
                    }
                } catch (error) {
                    console.log("something wrong with post: ", post);
                    console.log("error: ", error);
                }
                await pageContext.close();
            });

        await Promise.all(requests);
    }
    await goToPageWithUrl(page, baseURL + "posts");
    await page.screenshot({
        path: getAbsoluteUrl(`./images/${profile.cmsCategory}.png`),
        fullPage: true,
    });
    page.off("dialog");
    browser.close();
};

const main = async () => {
    // run at 1:00 AM ?
    let date = new Date();
    console.log("Start at " + date.toISOString());
    date.setDate(date.getDate() - 1);
    date = date.toISOString().slice(0, 10);

    let cmsData = await callApi({
        url: "/wp-json/v1/check-wix-posts?timeString=" + date,
        baseURl: BASE_URL,
        method: "GET",
    });
    if (cmsData.length === 0) {
        console.log("Nothing to post");
        return;
    }
    const rawData = fs.readFileSync(getAbsoluteUrl("./src/data/profile.json"));
    let profile = JSON.parse(rawData);
    cmsData = cmsData
        .filter((data) => data.category.length > 0)
        .map((data) => ({
            ...data,
            category: data.category[0].slug,
        }));
    cmsData = groupBy(cmsData, "category");
    const profiles = [];
    for (const category in cmsData) {
        const profileItem = {
            ...profile[category],
            posts: cmsData[category],
        };
        profiles.push(profileItem);
    }
    for (const profileData of profiles) {
        try {
            await auto(profileData);
        } catch (error) {
            console.log("run fail with user: ", profileData.username);
            console.log("error: ", error);
        }
    }
    const doneDate = new Date();
    console.log("Done at " + doneDate.toISOString());
};

main();
