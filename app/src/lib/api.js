import axios from 'axios';

export const config = {
  baseURL: null,
  headers: {
    'Content-Type': 'application/json',
  },
};

const API = () => {
  const getConfig = () => {
    let current = config;
    if (api.baseURL) {
      current = {
        ...config,
        baseURL: api.baseURL,
      };
    }
    return api?.token
      ? {
          ...current,
          headers: { ...config.headers, Authorization: `Bearer ${api.token}` },
        }
      : current;
  };
  return {
    get: (url, config = {}) => axios({ url, ...getConfig(), ...config }),
    post: (url, data, config = {}) =>
      axios({
        url,
        method: 'POST',
        data,
        ...{
          ...getConfig(),
          headers: {
            ...getConfig().headers,
            ...config?.headers,
          },
        },
      }),
    put: (url, data, config) => axios({ url, method: 'PUT', data, ...getConfig(), ...config }),
    patch: (url, data, config) => axios({ url, method: 'PATCH', data, ...getConfig(), ...config }),
    delete: (url) => axios({ url, method: 'DELETE', ...getConfig() }),
    setToken: (token) => {
      api.token = token;
    },
    setServerURL: (serverURL) => {
      api.baseURL = serverURL;
    },
    getConfig,
  };
};

const api = API();

export default api;
