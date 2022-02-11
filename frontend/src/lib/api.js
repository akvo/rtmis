import axios from "axios";

export const config = {
  baseURL: "/api/v1/",
  headers: {
    "Content-Type": "application/json",
  },
};

const API = () => {
  const getConfig = () => {
    return api?.token
      ? {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${api.token}`,
          },
        }
      : config;
  };
  return {
    get: (url, config = {}) => axios({ url, ...getConfig(), ...config }),
    post: (url, data, config = {}) =>
      axios({ url, method: "POST", data, ...getConfig(), ...config }),
    put: (url, data, config) =>
      axios({ url, method: "PUT", data, ...getConfig(), ...config }),
    patch: (url, data, config) =>
      axios({ url, method: "PATCH", data, ...getConfig(), ...config }),
    delete: (url) => axios({ url, method: "DELETE", ...getConfig() }),
    setToken: (token) => {
      api.token = token;
    },
  };
};

const api = API();

export default api;
