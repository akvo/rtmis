import "@testing-library/jest-dom";
import api from "../api";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

jest.mock("axios");

const fakeToken = "eyJhbGciOiJIUzI1NiIsInR56IkpXVCxxxxxxxxxxx";

const fetchUsers = async () => {
  try {
    const users = await api.get();
    return users;
  } catch (err) {
    return [];
  }
};

const headers = {
  Accept: "application/json, text/plain, */*",
  Authorization: `Bearer ${fakeToken}`,
  "Content-Type": "application/json",
};

describe("lib/api", () => {
  let mock;

  beforeAll(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  test("test if token is being stored in the api sending the correct headers", async () => {
    api.setToken(fakeToken);
    expect(api.token).toStrictEqual(fakeToken);

    mock.onGet("something").reply((config) => {
      expect(config.baseURL).toEqual("/api/v1/");
      expect(config.headers).toEqual(headers);
      return [200, {}];
    });
    const result = await api.get("something");
    expect(result).toBeUndefined();
  });

  describe("mock a GET request", () => {
    it("should return users list", async () => {
      const users = [
        { id: 1, name: "John" },
        { id: 2, name: "Andrew" },
      ];
      api.get = jest.fn().mockResolvedValue(users);
      const result = await fetchUsers();
      expect(result).toEqual(users);
      expect(api.get).toHaveBeenCalledWith();
    });
  });
  describe("POST", () => {
    it("test a POST request", async () => {
      mock.onPost("/login").reply((config) => {
        expect(config.baseURL).toEqual("/api/v1/");
        expect(config.headers).toEqual(headers);
        return [200, {}];
      });
      await api.post("/login", {
        email: "toky@gmail.com",
        password: "FaTo!2&",
      });
    });
  });

  describe("PUT request", () => {
    test("test a PUT request", async () => {
      mock
        .onPut("/something", { id: 2, name: "PUT requests" })
        .reply((config) => {
          expect(config.headers).toEqual(headers);
          return [200];
        });
      await api.put("/something", { id: 2, name: "PUT requests" });
    });
  });

  describe("API Object", () => {
    test("snapshot api calls", () => {
      expect(api).toMatchSnapshot();
    });
  });
});
