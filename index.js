const puppeteer = require("puppeteer");
const fs = require("fs");
const moment = require("moment");
const { EmbedBuilder } = require("discord.js");
const { handleFillImage } = require("./src/handleContent/handleFillImage");
const { handleFillLink } = require("./src/handleContent/handleFillLink");
const {
    LINK_TYPE,
    IMAGE_TYPE,
    BASE_URL,
    H2_TYPE,
    H3_TYPE,
    H4_TYPE,
    H5_TYPE,
    H6_TYPE,
    HTTP_REQUEST_SUCCESS,
    DISCORD_ID,
} = require("./src/utils/constant");
const { goToPageWithUrl, groupBy } = require("./src/utils/utils");
const { formatHtmlString } = require("./src/handleContent/parseHtmlContent");
const { callApi } = require("./src/api");
const { handleFillText } = require("./src/handleContent/handleFillText");
const { DiscordConfig } = require("./src/utils/discordConfig");
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
    let baseURL = "";

    baseURL = `https://manage.wix.com/dashboard/${profile.pageWixId}/blog/`;
    await goToPageWithUrl(page, baseURL + "posts");

    if (page.url().indexOf("users.wix.com") > -1) {
        const embeds = await new EmbedBuilder()
            .setColor("Red")
            .setTitle(`Need to login to profile`)
            .setDescription(profile.cmsCategory)
            .setTimestamp();
        await DiscordConfig.getInstance().sendMessage({
            messageEmbed: embeds,
            userID: DISCORD_ID,
        });
        browser.close();
        return [];
    }

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
                const res = await page
                    .waitForResponse(
                        (response) =>
                            response.status() === HTTP_REQUEST_SUCCESS &&
                            response.url().includes(WIX_API_POSTS + "?offset")
                    )
                    .then((response) => response.json());
                const ids = res.map((d) => d.id);
                listPostsId.push(...ids);
            }
        }
    }

    const MAX_PAGE_HANDLE = 1;
    let countPostsSuccess = 0;
    const postFailed = [];
    for (let i = 0; i < profile.posts.length; i += MAX_PAGE_HANDLE) {
        const requests = profile.posts
            .slice(i, i + MAX_PAGE_HANDLE)
            .map(async (post) => {
                const pageContext = await browser.newPage();
                try {
                    if (
                        post.post_wix_id &&
                        listPostsId.indexOf(post.post_wix_id) < -1
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
                        await createPost(pageContext, post, false);
                    }
                    countPostsSuccess++;
                } catch (error) {
                    console.log(
                        "\x1b[41m%s\x1b[0m",
                        "something wrong with post: ",
                        post.post_title
                    );
                    console.log("ID: ", post.ID);
                    console.log("origin link: ", post.link);
                    // console.log("error: ", error);
                    postFailed.push(post);
                }
                await pageContext.close();
            });

        await Promise.all(requests);
    }
    console.log(`${countPostsSuccess}/${profile.posts.length}`);
    page.off("dialog");
    browser.close();
    return postFailed;
};

const main = async () => {
    try {
        await DiscordConfig.getInstance().init();
    } catch (err) {
        console.log("xxxx", err);
    }

    if (!fs.existsSync(`${PATH}/logs`)) {
        fs.mkdirSync(`${PATH}/logs`);
    }
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
        process.exit();
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

    let profileFailed = [];
    for (const profileData of profiles) {
        console.log("-----------------------------------------------");
        console.log("number posts: ", profileData.posts.length);
        try {
            const postFailed = await auto(profileData);
            if (postFailed.length > 0) {
                profileFailed.push({
                    ...profileData,
                    posts: postFailed.reverse(),
                });
            }
        } catch (error) {
            console.log("run fail with user: ", profileData.username);
            console.log("error: ", error);
        }
    }

    const TIME_TRY = 1;
    let doneDate = new moment();
    if (profileFailed.length !== 0) {
        for (let count = 0; count < TIME_TRY; count++) {
            console.log("Try time: ", count + 1);
            if (profileFailed.length === 0) {
                break;
            }
            for (let index = 0; index < profileFailed.length; index++) {
                const posts = profileFailed[index].posts;
                console.log("-----------------------------------------------");
                console.log("number posts: ", posts.length);
                try {
                    const postFailed = await auto(profileFailed[index]);
                    profileFailed[index].posts = postFailed;
                } catch (error) {
                    console.log(
                        "run fail with user: ",
                        profileFailed[index].username
                    );
                    console.log("error: ", error);
                }
            }

            profileFailed = profileFailed.filter((p) => p.posts.length > 0);
        }

        if (profileFailed.length > 0) {
            // send discord message to notice post failed
            const requests = profileFailed.map(async (p) => {
                let message = "";
                p.posts.forEach((post) => {
                    message += `title: ${post.post_title}\rlink: ${post.link}\r\r`;
                });
                const embeds = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle(`Posts failed with category:   ${p.cmsCategory}`)
                    .setDescription(message)
                    .setTimestamp();
                await DiscordConfig.getInstance().sendMessage({
                    messageEmbed: embeds,
                    userID: DISCORD_ID,
                    spam: true,
                });
            });

            await Promise.all(requests);
            fs.writeFileSync(
                `${PATH}/logs/posts-failed-${doneDate.format(
                    "DD-MM-YYYY"
                )}.json`,
                JSON.stringify(profileFailed)
            );
        }
    }

    console.log("-----------------------------------------------");
    console.log("End at " + doneDate.format(DATE_FORMAT));
    process.exit();
};

main();
