import { tileLayer } from "../tileLayer";

describe("util/tileLayer", () => {
  test("check the tileLayer objecr", () => {
    expect(tileLayer).toEqual(
      expect.objectContaining({
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      })
    );
    expect(tileLayer).toMatchSnapshot();
  });
});
