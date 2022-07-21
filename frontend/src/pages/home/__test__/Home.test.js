import { render, screen } from "@testing-library/react";
import TestApp from "../../../TestApp";
import "@testing-library/jest-dom";

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

jest.mock("axios");
jest.mock("leaflet");

describe("Home page", () => {
  const { asFragment } = render(<TestApp />);
  test("test if About RUSH exists", () => {
    expect(screen.getByText("About RUSH")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The Kenya Rural Urban Sanitation and Hygiene (RUSH) platform is a real-time monitoring and information system owned by the Ministry of Health. The platform aggregates quantitative and qualitative data from county and national levels and facilitates data analysis, report generation and visualizations."
      )
    ).toBeInTheDocument();
    expect(asFragment).toMatchSnapshot();
  });
});
