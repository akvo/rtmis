import "@testing-library/jest-dom";
import geo from "../geo";

describe("geo", () => {
  test("test if getBounds when empty array is passed as administration", () => {
    const expectedResult = {
      bbox: [
        [NaN, NaN],
        [NaN, NaN],
      ],
      coordinates: [NaN, NaN],
    };
    expect(geo.getBounds([])).toEqual(expectedResult);
  });

  test("test if getBounds with an administration", () => {
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
          {
            full_name: "Kenya|Bomet",
            id: 3,
            level: 1,
            name: "Bomet",
            parent: 1,
            path: "1.",
          },
          {
            full_name: "Kenya|Bungoma",
            id: 4,
            level: 1,
            name: "Bungoma",
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

    const bounds = geo.getBounds(administration);
    expect(typeof bounds).toBe("object");
    expect(bounds).toHaveProperty("coordinates");
  });
  test("defaultPos", () => {
    expect(typeof geo.defaultPos()).toBe("object");
  });
  test("check geo Object", () => {
    expect(geo).toHaveProperty("geojson");
    expect(geo).toHaveProperty("shapeLevels");
    expect(geo).toHaveProperty("tile");
    expect(geo).toHaveProperty("getBounds");
    expect(geo).toHaveProperty("defaultPos");
    expect(geo).toMatchSnapshot();
  });
});
