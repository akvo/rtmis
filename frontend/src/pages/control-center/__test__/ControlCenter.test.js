import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import ControlCenter from "../ControlCenter";
import { MemoryRouter } from "react-router-dom";

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  };

describe("pages/control-center", () => {
  test("Test if the heading is on the document", () => {
    const { container, getByText } = render(<ControlCenter />, {
      wrapper: MemoryRouter,
    });
    expect(container).toMatchSnapshot();
    expect(getByText("Control Center")).toBeInTheDocument();
    expect(
      getByText(
        "Instant access to all the administration pages and overview panels for data approvals."
      )
    ).toBeInTheDocument();
  });

  test("test cards", () => {
    const { container, getByTestId } = render(<ControlCenter />, {
      wrapper: MemoryRouter,
    });
    expect(getByTestId("control-center-cards")).toContainHTML("div");
    const card = container.querySelector(".card-wrapper");
    expect(card).toMatchSnapshot();
  });
});
