import dummy from "../dummy";

const chartData = [
  {
    name: "Var A",
    stack: "Stack 1",
    value: 10,
  },
  {
    name: "Var B",
    stack: "Stack 2",
    value: 13,
  },
  {
    name: "Var C",
    stack: "Stack 2",
    value: 20,
  },
  {
    name: "Var D",
    stack: "Stack 1",
    value: 24,
  },
  {
    name: "Var E",
    stack: "Stack 2",
    value: 14,
  },
];

describe("util/dummy", () => {
  test("test if dummy has a chartData as an array of objects", () => {
    expect(dummy.chartData).toBeDefined();
    expect(dummy.chartData).toEqual(expect.arrayContaining(chartData));
    expect(dummy).toMatchSnapshot({
      chartData: expect.any(Array),
    });
  });
});
