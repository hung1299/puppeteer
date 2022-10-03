const puppeteer = require("puppeteer");
const fs = require("fs");
const moment = require("moment");
const { handleFillImage } = require("./src/handleContent/handleFillImage");
const { handleFillLink } = require("./src/handleContent/handleFillLink");
const {
    LINK_TYPE,
    IMAGE_TYPE,
    NETWORK_STATUS,
    BASE_URL,
    H2_TYPE,
    H3_TYPE,
    H4_TYPE,
    H5_TYPE,
    H6_TYPE,
    HTTP_REQUEST_SUCCESS,
} = require("./src/utils/constant");
const {
    getBaseBlogURL,
    getPageContext,
    goToPageWithUrl,
    groupBy,
} = require("./src/utils/utils");
const { formatHtmlString } = require("./src/handleContent/parseHtmlContent");
const { callApi } = require("./src/api");
const { handleFillText } = require("./src/handleContent/handleFillText");
const PATH = __dirname;
const HEADER_TYPE = [H2_TYPE, H3_TYPE, H4_TYPE, H5_TYPE, H6_TYPE];
const WIX_API_POSTS =
    "https://manage.wix.com/_api/communities-blog-node-api/_api/posts";

const handleFillContent = async (content, page) => {
    switch (content.type) {
        case LINK_TYPE:
            await handleFillLink(content, page);
            break;
        case IMAGE_TYPE:
            await handleFillImage(content, page);
            break;
        default:
            await handleFillText(content, page);
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
    await page.keyboard.down("Control");
    await page.keyboard.press("a");
    await page.keyboard.up("Control");
    await page.keyboard.press("Delete");
    await createPost(page, post, false);
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
        if (
            content.length > 0 &&
            HEADER_TYPE.includes(content[content.length - 1].type)
        ) {
            continue;
        }
        await page.keyboard.press("Enter");
    }

    const { id: post_wix_id } = await page
        .waitForResponse(
            (response) =>
                response.status() === HTTP_REQUEST_SUCCESS &&
                response.url().includes(WIX_API_POSTS)
        )
        .then((response) => response.json());
    if (isPageIdNull) {
        await callApi({
            url: "/wp-json/v1/save-wix-data",
            baseURl: BASE_URL,
            params: {
                ID: post.ID,
                field: "post_wix_id",
                fieldData: post_wix_id,
            },
        });
        // console.log(`post_wix_id updated`);
    }
    const submitBtn = await page.waitForSelector(
        "[data-hook='topbar-publish-button'][aria-disabled='false']",
        { timeout: 200000 }
    );
    await Promise.all([submitBtn.click(), page.waitForNavigation()]);
    await page.waitForTimeout(1000);
};

const auto = async (profile) => {
    if (!fs.existsSync(`${PATH}/user-data`)) {
        fs.mkdirSync(`${PATH}/user-data`);
    }
    if (!fs.existsSync(`${PATH}/images`)) {
        fs.mkdirSync(`${PATH}/images`);
    }
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--user-data-dir=${PATH}/user-data/${profile.cmsCategory}`,
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
    if (page.url().indexOf("users.wix.com") > -1) {
        console.log('Need to login to profile: ');
        console.log("\x1b[41m%s\x1b[0m", profile.cmsCategory);
        console.log(`username: ${profile.username}`);
        console.log(`password: ${profile.password}`);
        // Handle login
        // await page.waitForTimeout(1000000);
        browser.close();
        return;
    }
    let baseURL = "";
    if (!profile.pageWixId) {
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
        baseURL = await getBaseBlogURL(page);
    } else {
        baseURL = `https://manage.wix.com/dashboard/${profile.pageWixId}/blog/`;
    }

    await goToPageWithUrl(page, baseURL + "posts");
    const listPostsId = await page.$$eval("tr[data-hook]", (nodes) =>
        nodes.map((node) => {
            const text = node.getAttribute("data-hook");
            return text.slice(text.indexOf("item-") + 5);
        })
    );
    let pageContainerElement = await page.$("[data-hook=page-strip]");
    if (pageContainerElement) {
        let nodeParent = await pageContainerElement.$(":scope > *");
        let pageNodes = await nodeParent.$$(":scope > *");

        if (pageNodes.length && pageNodes.length > 1) {
            for (let index = 1; index < pageNodes.length; index++) {
                await pageNodes[index].click();
                await page.waitForResponse(
                    (response) =>
                        response.status() === HTTP_REQUEST_SUCCESS &&
                        response.url().includes(WIX_API_POSTS)
                );
                const newListPosts = await page.$$eval(
                    "tr[data-hook]",
                    (nodes) =>
                        nodes.map((node) => {
                            const text = node.getAttribute("data-hook");
                            return text.slice(text.indexOf("item-") + 5);
                        })
                );
                listPostsId.push(...newListPosts);
            }
        }
    }

    const MAX_PAGE_HANDLE = 1;
    let countPostsSuccess = 0;
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
                    console.log(
                        "\x1b[41m%s\x1b[0m",
                        "something wrong with post: ",
                        post.title,
                        post.ID,
                        post.link
                    );
                    console.log("error: ", error);
                }
                await pageContext.close();
            });

        await Promise.all(requests);
        countPostsSuccess++;
    }
    console.log(`${countPostsSuccess}/${profile.posts.length}`);
    await goToPageWithUrl(page, baseURL + "posts");
    await page.screenshot({
        path: `${PATH}/images/${profile.cmsCategory}.png`,
        fullPage: true,
    });
    page.off("dialog");
    browser.close();
};

const main = async () => {
    let date = new moment();
    const DATE_FORMAT = "hh:mm:ss A YYYY-MM-DD";
    console.log("Start at " + date.format(DATE_FORMAT));
    date = date.add(-1, "days").format("YYYY-MM-DD");
    date = "2002-09-01"; // get all posts
    let cmsData = await callApi({
        url: "/wp-json/v1/check-wix-posts?timeString=" + date,
        baseURl: BASE_URL,
        method: "GET",
    });
    if (cmsData.length === 0) {
        console.log("Nothing to post");
        return;
    }
    const rawData = fs.readFileSync(`${PATH}/src/data/profile.json`);
    let profile = JSON.parse(rawData);
    cmsData = cmsData
        .filter((data) => data.category.length > 0)
        .map((data) => ({
            ...data,
            category: data.category[0].slug,
        }));
    cmsData = groupBy(cmsData, "category");
    let profiles = [];
    for (const category in cmsData) {
        const profileItem = {
            ...profile[category],
            posts: cmsData[category].reverse(),
        };
        profiles.push(profileItem);
    }
    profiles = profiles.filter(
        (profile) =>
            profile.cmsCategory && profile.cmsCategory !== "uncategorized"
    );
    for (const profileData of profiles) {
        console.log("-----------------------------------------------");
        console.log("number posts: ", profileData.posts.length);
        try {
            await auto(profileData);
        } catch (error) {
            console.log("run fail with user: ", profileData.username);
            console.log("error: ", error);
        }
    }
    let doneDate = new moment();
    console.log("-----------------------------------------------");
    console.log("Start at " + doneDate.format(DATE_FORMAT));
};

main();
