import { generateAdvanceFilterURL } from "../filter";

describe("util/filter", () => {
  test("test if generateAdvanceFilterURL returns the expected value", async () => {
    const url = "jmp/519630048?administration=1&";
    const advancedFilterFakeData = [
      {
        id: 603100002,
        question: "Whether Urban, Peri Urban or Rural",
        value: 13492,
        label: "Rural",
      },
    ];

    const result = generateAdvanceFilterURL(advancedFilterFakeData, url);
    expect(result).toBe(
      "jmp/519630048?administration=1&&options=603100002%7C%7Crural"
    );
    expect(result).toMatchSnapshot();
  });
});
