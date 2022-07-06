import "@testing-library/jest-dom";
import { getBounds, defaultPos } from "./geo";
import geo from "./geo";

const administration = [
  {
    childLevelName: "County",
    children: [
      {
        full_name: "Kenya|Baringo",
        id: 2,
        level: 1,
        name: "Baringo",
        parent: 1,
        path: "1.",
      },
    ],
    full_name: "Kenya",
    id: 1,
    level: 0,
    levelName: "National",
    name: "Kenya",
    parent: null,
    path: null,
  },
];

describe("geo", () => {
  test("test if getBounds when empty array is passed as administration", () => {
    const expectedResult = {
      bbox: [
        [NaN, NaN],
        [NaN, NaN],
      ],
      coordinates: [NaN, NaN],
    };
    expect(getBounds([])).toEqual(expectedResult);
  });
  test("test if getBounds with an administration", () => {
    expect(getBounds(administration)).toHaveProperty("bbox");
    expect(getBounds(administration)).toHaveProperty("coordinates");
  });
  test("defaultPos", () => {
    expect(defaultPos()).toHaveProperty("coordinates");
  });
  test("check geo Object", () => {
    expect(geo).toHaveProperty("geojson");
    expect(geo).toHaveProperty("shapeLevels");
    expect(geo).toHaveProperty("tile");
    expect(geo).toHaveProperty("getBounds");
    expect(geo).toHaveProperty("defaultPos");
  });
});
