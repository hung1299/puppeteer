const { BASE_URL, HTTP_REQUEST_SUCCESS } = require("../utils/constant");
const Axios = require("axios").default;

const callApi = ({ method, url, params, baseURl, headers }) => {
    return new Promise((resolve, reject) => {
        return Axios({
            baseURL: baseURl ? baseURl : BASE_URL,
            url: url,
            method: method ? method : "POST",
            data: params ? params : null,
            headers,
        })
            .then((response) => {
                if (response.status === HTTP_REQUEST_SUCCESS) {
                    resolve(response.data);
                }
            })
            .catch((e) => {
                reject(e);
            });
    });
};

exports.callApi = callApi;
