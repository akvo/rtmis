import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TestApp from "../../../TestApp";
import axios from "axios";
import { act } from "react-dom/test-utils";

jest.mock("axios");

// Footer tests
describe("pages/Dashboard", () => {
  test("test tabs with selected form", async () => {
    const selectedForm = [
      [
        {
          type: "card",
          title: "Number of HHs reporting",
          calc: "sum",
          path: "total",
          icon: "households.svg",
          scale: 1580000,
          color: "#CBBFFF",
        },
        {
          type: "card",
          title: "Number of ##administration_level## reporting",
          calc: "count",
          path: "length",
          icon: "counties.svg",
          color: "#FFDBBF",
        },
        {
          type: "card",
          title: "HHs with safely managed sanitation facilities",
          calc: "percent",
          path: "data.sanitation service level.safely managed",
          icon: "safely-managed.svg",
          color: "#FFF8BF",
        },
        {
          type: "card",
          title: "HHs with Basic hand hygiene facilities",
          calc: "percent",
          path: "data.hygiene service level.basic",
          icon: "hand-hygiene.svg",
          color: "#BFF7FF",
        },
        {
          type: "card",
          title: "HHs with sanitation facilities at grade 3",
          calc: "percent",
          path: null,
          icon: "sanitation.svg",
          color: "#99BF9A",
        },
        {
          type: "card",
          title: "HHs with hand hygiene facilities at grade 3",
          calc: "percent",
          path: null,
          icon: "hand-hygiene.svg",
          color: "#F1DBB5",
        },
      ],
      [
        {
          type: "maps",
          title: "Count of HHs data submitted",
          calc: "default",
          path: "total",
          span: 24,
        },
      ],
      [
        {
          type: "chart",
          title: "Trend of HHs datapoint submission",
          selector: "period",
          span: 24,
          path: "total",
        },
      ],
    ];
    const lastUpdate = "01/07/2020";
    const fakeData = [
      {
        loc: "Bomet",
        data: {
          "hygiene service level": {
            basic: 3,
            limited: 7,
            "no facility": 14,
          },
          "menstrual hygiene service level": {
            access: 12,
            awareness: 6,
            participation: 22,
            "use of menstrual materials": 12,
          },
          "sanitation service level": {
            basic: 8,
            limited: 4,
            "open defecation": 2,
            "safely managed": 4,
            unimproved: 14,
          },
        },
        total: 22,
      },
    ];

    axios.mockResolvedValue({ status: 200, data: lastUpdate });
    axios.mockResolvedValue({ status: 200, data: fakeData });

    let wrapper;
    await act(async () => {
      wrapper = render(<TestApp entryPoint={"/dashboard/519630048"} />);
    });

    const { container, getAllByRole } = wrapper;
    const overviewTab = getAllByRole("tab")[0];
    expect(overviewTab).toHaveTextContent("Overview");
    fireEvent.click(overviewTab);
    expect(selectedForm).toBeDefined();

    expect(container).toMatchSnapshot();
  });
});
