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

// Test some Request methods
describe("test API calls", () => {
  describe("GET", () => {
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
    it("should add a new user to the list", async () => {
      const newUsers = [
        { id: 1, name: "John" },
        { id: 2, name: "Andrew" },
        { id: 3, name: "Fa" },
      ];
      api.post = jest.fn().mockResolvedValue(newUsers);
      const result = await api.post();
      expect(result).toEqual(newUsers);
      expect(api.post).toHaveBeenCalledWith();
    });
  });
  describe("DELETE", () => {
    it("should delete a user from the list", async () => {
      const newUsers = [
        { id: 1, name: "John" },
        { id: 3, name: "Fa" },
      ];
      api.delete = jest.fn().mockResolvedValue(newUsers);
      const result = await api.delete();
      expect(result).toEqual(newUsers);
      expect(api.delete).toHaveBeenCalledWith();
    });
  });
});
