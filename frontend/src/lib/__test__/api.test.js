import "@testing-library/jest-dom";
import api from "../api";

describe("lib/api", () => {
  test("test if token is being stored in the api", () => {
    const fakeToken = "eyJhbGciOiJIUzI1NiIsInR56IkpXVCxxxxxxxxxxx";

    api.setToken(fakeToken);
    expect(api.token).toStrictEqual(fakeToken);
  });
});
