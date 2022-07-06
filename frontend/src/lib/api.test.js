import "@testing-library/jest-dom";
import api from "./api";

jest.mock("axios");

const fetchUsers = async () => {
  try {
    const users = await api.get();
    return users;
  } catch (err) {
    return [];
  }
};

const users = [
  { id: 1, name: "John" },
  { id: 2, name: "Andrew" },
];

describe("test API calls", () => {
  describe("GET", () => {
    it("should return users list", async () => {
      api.get = jest.fn().mockResolvedValue(users);
      const result = await fetchUsers();
      expect(result).toEqual(users);
      expect(api.get).toHaveBeenCalledWith();
    });
  });
});
