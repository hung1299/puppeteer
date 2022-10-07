const Axios = require("axios").default;

const callApi = ({ method, url, params, headers }) => {
    return new Promise((resolve, reject) => {
        return Axios({
            url: url,
            method: method ? method : "POST",
            data: params ? params : null,
            headers,
        })
            .then((response) => {
                resolve(response.data);
            })
            .catch((e) => {
                reject(e);
            });
    });
};

exports.callApi = callApi;
