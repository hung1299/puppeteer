const { callApi } = require("../api");
require("dotenv").config();

const sendMessageWebHook = ({ username, content }) => {
    return callApi({
        url: process.env.WEB_HOOK_DEV_TEST,
        method: "POST",
        params: {
            username,
            content,
        },
    });
};

exports.sendMessageWebHook = sendMessageWebHook;
