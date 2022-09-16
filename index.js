const puppeteer = require("puppeteer");
const fs = require("fs");
const moment = require("moment");
const { handleFillImage } = require("./src/handleContent/handleFillImage");
const { handleFillLink } = require("./src/handleContent/handleFillLink");
const {
    PARAGRAPH_TYPE,
    LINK_TYPE,
    IMAGE_TYPE,
    NETWORK_STATUS,
    BASE_URL,
} = require("./src/utils/constant");
const {
    getAbsolutePath,
    getBaseBlogURL,
    getPageContext,
    goToPageWithUrl,
    groupBy,
} = require("./src/utils/utils");
const { formatHtmlString } = require("./src/handleContent/parseHtmlContent");
const { callApi } = require("./src/api");
const {
    handleFillHeaderText,
} = require("./src/handleContent/handleFillHeaderText");
const PATH = __dirname;

const handleFillContent = async (content, page) => {
    switch (content.type) {
        case PARAGRAPH_TYPE:
            await page.keyboard.sendCharacter(content.text);
            await page.keyboard.press("Space");
            break;
        case LINK_TYPE:
            await handleFillLink(content, page);
            break;
        case IMAGE_TYPE:
            await handleFillImage(content.url, page);
            break;
        default:
            await handleFillHeaderText(content, page);
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
    // const pageContent = formatHtmlString( ///  FOR TEST TING
    //     "<h2>Can you drive alone at 16 in DC?</h2>\r\nYou can drive alone. If you are under 18 years old, you can drive with no more than 2 passengers under age 21. This restriction does not apply to passengers who are your siblings.\r\n<h2>How do I become a truck driver in BC?</h2>\r\nGet your commercial learner's licence. To get your learner's licence you'll need to study and pass a knowledge test. ... Step 1: Study. Read and study driving commercial vehicles. ... Step 2: Take your test(s) Book an appointment to take your test at an ICBC driver licensing office* ... About the commercial knowledge test.\r\n<h2>New rules for commercial driver's licenses</h2>\r\n<h2>How many questions are on the CDL permit test in DC?</h2>\r\n50 The District of Columbia CDL test consists of 50 questions. To pass, you must correctly answer at least 40 questions (80%). ... DC CDL Practice Test. Number of questions: 50 Correct answers to pass: 40 Passing score: 80%\r\n<h2>How do you get your CDL in DC?</h2>\r\nTo get a DC DMV CDL, you must: Have a valid non-commercial driver license (NCDL). Meet identity, residency, and good driving history eligibility qualifications. Take the applicable CDL knowledge tests. Get a CDL learner permit. Take Entry-Level Driver Training (ELDT) by an approved FMCSA training provider, if required. More items...\r\n<h2>What age can you drive in DC?</h2>\r\nYou must be at least 16 years old to get a DC DMV learner permit, and you must pass vision screening and knowledge tests and provide documentation that proves your identity, residency, and eligibility, among other things. DC DMV offers learners either a REAL ID or a Limited Purpose learner permit.\r\n<h2>New rules for those looking to get their first commercial driver license</h2>\r\n<h2>Can you drive by yourself with a provisional license in DC?</h2>\r\nObtaining a Provisional License The Provisional License allows teens to drive alone, with hour restrictions. In July and August, holders may drive from 6AM until midnight. Between September and June, teens are permitted to drive between 6AM and 11PM Monday through Thursday, and 6AM until midnight Friday through Sunday.\r\n<h2>How much do long haul truck drivers make in BC?</h2>\r\nThe average salary for a long haul driver is $50.06 per hour in Vancouver, BC.\r\n<h2>What is class 5 license BC?</h2>\r\nA BC Class 5 license is the final stage in becoming a completely certified British Columbia driver, but to get your Class 5 licence, you need to demonstrate that you are a capable, safe driver in any road or weather conditions.\r\n<h2>New Commercial Drivers License Training Requirements Now In Effect</h2>\r\n<h2>What is Class 3 license BC?</h2>\r\nThe BC Class 3 license is a commercial driver's license that allows you to drive: trucks with more than two axles, such as dump trucks and large tow trucks but does not allow driving a bus carrying passengers. a tow car towing a vehicle of any weight.\r\n<h2>What happens if you fail CDL permit test?</h2>\r\nFailing either the written or driving portion of the CDL exam will mean that you have to wait three full days before you are eligible to retake the test. You can take your test again on the fourth day or wait as long as you would like to feel prepared. Mar 20, 2018\r\n<h2>How do I get my CDL permit in VA?</h2>\r\nTo obtain a CDL or commercial learner's permit (CLP) in Virginia, you must meet all requirements for a Virginia driver's license. You may hold either a driver's license or a CDL, but not both. You must apply for your CDL or CLP in person at a DMV customer service center.\r\n<h2>2020 CDL California DMV Written Test - Knowledge Test Class A #1</h2>\r\n<h2>How much does a CDL cost in DC?</h2>\r\n$117 $47/8 years (Effective Oct 1, 2015) Commercial Driver License Service Fee Commercial Driver License (First-Time and Renewal) $117 Commercial Driver License Downgrade $20 Commercial Driver License Duplicate $20 Commercial Driver License Endorsement $20 3 more rows\r\n<h2>How much is a CDL license?</h2>\r\nAs we discussed in our previous article, CDL tuition can range from $1,500 to $8,000. Combined with the other costs described above, obtaining your CDL can cost up to $9,000. These costs all depend on the location of your licensing and your training. Oct 28, 2020\r\n<h2>How long does it take to get a CDL?</h2>\r\nOn average, it takes about seven weeks to get your CDL (commercial driver's license) when attending a full-time driver training program. The length of time it takes to get your CDL relies on a handful of factors. It can take as little as three weeks or upwards of six months. Oct 12, 2018"
    // );
    await page.click("[data-hook='post-form__content']");
    for (const content of pageContent) {
        for (const data of content) {
            await handleFillContent(data, page);
        }
        if (
            content.length > 0 &&
            content[content.length - 1].type === PARAGRAPH_TYPE
        ) {
            await page.keyboard.press("Enter");
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
        console.log(
            `Need to log in at ${profile.username} with cmsCategory ${profile.cmsCategory}`
        );
        browser.close();
        return;
    }

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
                        await createPost(pageContext, post, false);
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
        path: `${PATH}/images/${profile.cmsCategory}.png`,
        fullPage: true,
    });
    page.off("dialog");
    browser.close();
};

const main = async () => {
    let date = new moment();
    console.log("Start at " + date.format("hh:mm:ss A YYYY-MM-DD"));
    // 2022-09-15
    date = date.add(-1, "days").format("YYYY-MM-DD");
    date = "2022-01-16";
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
    const profiles = [];
    for (const category in cmsData) {
        const profileItem = {
            ...profile[category],
            posts: cmsData[category],
        };
        profiles.push(profileItem);
    }
    for (const profileData of profiles) {
        console.log("number posts: ", profileData.posts.length);
        try {
            await auto(profileData);
        } catch (error) {
            console.log("run fail with user: ", profileData.username);
            console.log("error: ", error);
        }
    }
    let doneDate = new moment();
    console.log("Start at " + doneDate.format("hh:mm:ss A YYYY-MM-DD"));
};

main();
