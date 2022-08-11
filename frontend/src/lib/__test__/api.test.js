import MockAdapter from "axios-mock-adapter";
import "@testing-library/jest-dom";
import api from "../api";
import axios from "axios";

const fakeToken = "eyJhbGciOiJIUzI1NiIsInR56IkpXVCxxxxxxxxxxx";

describe("lib/api", () => {
  test("test if token is being stored in the api and sending correct headers", async () => {
    const mock = new MockAdapter(axios);
    api.setToken(fakeToken);
    expect(api.token).toStrictEqual(fakeToken);

    mock.onGet("/something").reply((config) => {
      expect(config.baseURL).toEqual("/api/v1/");
      expect(config.headers).toEqual({
        Accept: "application/json, text/plain, */*",
        Authorization: `Bearer ${fakeToken}`,
        "Content-Type": "application/json",
      });
      return [200, {}];
    });

    await api.get("/something");
  });
});
