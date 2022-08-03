import "@testing-library/jest-dom";
import uiText from "../ui-text";

describe("UI Text", () => {
  test("check text languages", () => {
    expect(uiText).toHaveProperty("de");
    expect(uiText).toHaveProperty("en");
    expect(uiText).toMatchSnapshot();
  });
});
