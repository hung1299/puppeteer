const path = require("path");
const { NETWORK_STATUS } = require("./constant");

exports.getAbsoluteUrl = (url) => {
    return path.resolve(url);
};

exports.getPageContext = async (browser, page) => {
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

exports.getBaseBlogURL = async (page) => {
    const blogUrl = page.url();
    const index = blogUrl.indexOf("?");
    return blogUrl.slice(0, index) + "/blog/";
};

exports.goToPageWithUrl = async (page, url) => {
    await page.goto(url, {
        waitUntil: NETWORK_STATUS,
    });
};

exports.groupBy = (array, key) => {
    return array.reduce((result, currentValue) => {
        (result[currentValue[key]] = result[currentValue[key]] || []).push(
            currentValue
        );
        return result;
    }, {});
};
