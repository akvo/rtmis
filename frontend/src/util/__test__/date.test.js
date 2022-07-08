import { getDateRange, timeDiffHours } from "../date";

describe("App", () => {
  test("test if getDateRange is return correct value", () => {
    const dateTest = getDateRange({
      startDate: "20221101",
      endDate: "20230104",
    });
    expect(dateTest).toStrictEqual(["November 01, 2022", "December 01, 2022"]);
  });

  test("test timeDiffHours", () => {
    expect(timeDiffHours(1657280905.183572)).toBeDefined();
  });
});
