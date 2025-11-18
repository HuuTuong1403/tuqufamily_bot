const axios = require("axios");
const BOT_TOKEN = "8523863485:AAFlTIImymIWyYJsL5AtcOGJKAgEThIG3zw";
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

function getAxiosInstance() {
  return {
    get(method, params) {
      return axios.get(`/${method}`, { baseURL: BASE_URL, params });
    },
    post(method, data) {
      console.log("🚀 => BASE_URL:", BASE_URL);
      return axios({
        method: "post",
        baseURL: BASE_URL,
        url: `/${method}`,
        data,
      });
    },
  };
}

module.exports = { axiosInstance: getAxiosInstance() };
