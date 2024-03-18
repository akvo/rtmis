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
    get: (url, params = {}) => axios({ url, ...getConfig(), ...params }),
    post: (url, data, params = {}) =>
      axios({
        url,
        method: 'POST',
        data,
        ...{
          ...getConfig(),
          headers: {
            ...getConfig().headers,
            ...params?.headers,
          },
        },
      }),
    put: (url, data, params) => axios({ url, method: 'PUT', data, ...getConfig(), ...params }),
    patch: (url, data, params) => axios({ url, method: 'PATCH', data, ...getConfig(), ...params }),
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
