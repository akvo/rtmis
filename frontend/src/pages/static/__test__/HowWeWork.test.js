import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import HowWeWork from "../HowWeWork";

jest.mock("axios");

describe("pages/Settings", () => {
  test("test Setting page", async () => {
    const { container } = render(<HowWeWork />, { wrapper: MemoryRouter });
    expect(container).toMatchSnapshot();
  });
});
