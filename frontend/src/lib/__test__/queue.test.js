import "@testing-library/jest-dom";
import queue from "../queue";

describe("Store", () => {
  test("check the initial state", () => {
    const state = { next: null, wait: null };
    expect(queue).toHaveProperty("initialState", state);
    expect(queue.currentState).toMatchSnapshot({
      next: null,
      wait: null,
    });
  });
});
