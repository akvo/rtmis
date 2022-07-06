import "@testing-library/jest-dom";
import axios from "axios";

const BASE_URL = "https://jsonplaceholder.typicode.com";

export const config = {
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
};

const API = () => {
  const getConfig = () => {
    return config;
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
  };
};

// const api = API();

// const fetchUsers = async () => {
//   return await api.get("users");
// };

const users = [
  { id: 1, name: "John" },
  { id: 2, name: "Andrew" },
];

jest.mock("axios");

describe("fetchUsers", () => {
  describe("when API call is successful", () => {
    it("should return users list", async () => {
      axios.get.mockResolvedValueOnce(users);
      // then
      // expect(axios.get).toHaveBeenCalledWith(`${BASE_URL}/users`);
      //expect(result).toEqual(users);
    });
  });
});
