import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
import TestApp from "../../../TestApp";
import "@testing-library/jest-dom";
import Home, { Visuals } from "../Home";

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
    const tab = screen.getByRole("tablist");
    userEvent.click(tab.getElementsByClassName("ant-tabs-tab"));
    expect(
      baseElement.getElementsByClassName("ant-tabs-tab").firstElementChild
    ).toHaveClass("ant-tabs-tab-active");
    await waitFor(() => {
      expect(getByText("Description text here")).toBeInTheDocument();
    });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders the total asset count", async () => {
    const { highlights } = window;
    const currentHighlight = highlights.find(
      (x) => x.name === highlights?.[0]?.name
    );

    const mapValues = [
      {
        name: "Bungoma",
        title: "Bungoma",
        stack: [
          {
            name: "Safely Managed",
            title: "Safely Managed",
            value: 0,
            color: "#368541",
            total: 0,
          },
          {
            name: "Basic",
            title: "Basic",
            value: 0,
            color: "#79BE7D",
            total: 0,
          },
          {
            name: "Limited",
            title: "Limited",
            value: 0,
            color: "#FDF177",
            total: 0,
          },
          {
            name: "Unimproved",
            title: "Unimproved",
            value: 0,
            color: "#FBD256",
            total: 0,
          },
        ],
      },
    ];

    let wrapper;
    await act(async () => {
      wrapper = render(
        <Visuals current={currentHighlight} mapValues={mapValues} />
      );
    });
    wrapper.update();
    expect(wrapper.html()).toEqual(expect.stringMatching("Markers Shown of 3"));
  });
});
