import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TestApp from "../../../TestApp";
import "@testing-library/jest-dom";
import Home from "../Home";

jest.mock("axios");
jest.mock("leaflet");

const { asFragment } = render(<TestApp />);

describe("Home page", () => {
  test("test if About RUSH exists", () => {
    expect(screen.getByText("About RUSH")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The Kenya Rural Urban Sanitation and Hygiene (RUSH) platform is a real-time monitoring and information system owned by the Ministry of Health. The platform aggregates quantitative and qualitative data from county and national levels and facilitates data analysis, report generation and visualizations."
      )
    ).toBeInTheDocument();
    expect(asFragment).toMatchSnapshot();
  });

  test("tabs", async () => {
    const { baseElement, getByText } = render(<Home />);
    const handleClick = jest.fn();
    userEvent.click(screen.getByText("Household"));
    expect(
      baseElement.getElementsByClassName("ant-tabs-tab").firstElementChild
    ).toHaveClass("ant-tabs-tab-active");
    await waitFor(() => {
      expect(getByText("Description text here")).toBeInTheDocument();
    });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
