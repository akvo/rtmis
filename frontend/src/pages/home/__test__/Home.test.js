import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import TestApp from "../../../TestApp";
import "@testing-library/jest-dom";
import Home from "../Home";

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

const highlights = [
  {
    name: "Household",
    description: "Description text here",
    maps: {
      form_id: 519630048,
      option: "Safely Managed",
      fetch_api: false,
      shape: {
        title: "Sanitation service level - Safely Managed",
        type: "CRITERIA",
        calculation: "percent",
        criteria: [
          {
            name: "Safely Managed",
            options: [
              {
                question: 492490054,
                option: [
                  "Flush / pour flush",
                  "Pit latrine with slab",
                  "Twin pit with slab",
                ],
              },
              {
                question: 513690062,
                option: ["No"],
              },
              {
                question: 513690060,
                option: [
                  "Removed by service provider to a treatment plant",
                  "Removed by service provider to buried pit",
                  "Emptied by household buried in a covered pit",
                ],
              },
            ],
          },
        ],
      },
    },
    charts: [
      {
        form_id: 519630048,
        type: "CRITERIA",
        title: "Sanitation by JMP service levels",
        show_as_map: true,
        options: [
          {
            name: "Safely Managed",
            color: "#368541",
            score: 15,
            options: [
              {
                question: 492490054,
                option: [
                  "Flush / pour flush",
                  "Pit latrine with slab",
                  "Twin pit with slab",
                ],
              },
              {
                question: 513690062,
                option: ["No"],
              },
              {
                question: 513690060,
                option: [
                  "Removed by service provider to a treatment plant",
                  "Removed by service provider to buried pit",
                  "Emptied by household buried in a covered pit",
                ],
              },
            ],
          },
          {
            name: "Basic",
            score: 10,
            color: "#79BE7D",
            options: [
              {
                question: 492490054,
                option: [
                  "Flush / pour flush",
                  "Pit latrine with slab",
                  "Twin pit with slab",
                ],
              },
              {
                question: 513690062,
                option: ["No"],
              },
            ],
          },
          {
            name: "Limited",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 492490054,
                option: [
                  "Flush / pour flush",
                  "Pit latrine with slab",
                  "Twin pit with slab",
                ],
              },
              {
                question: 513690062,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "Unimproved",
            score: -2,
            color: "#FBD256",
            options: [
              {
                question: 492490054,
                option: [
                  "Pit latrine without slab / Open pit",
                  "Twin pit without slab",
                  "Bucket",
                  "Hanging toilet / hanging latrine",
                ],
              },
            ],
          },
          {
            name: "Open Defecation",
            score: -3,
            color: "#F1AC2A",
            options: [
              {
                question: 492490054,
                option: ["No facility / Bush / Field"],
              },
            ],
          },
        ],
      },
      {
        form_id: 519630048,
        type: "CRITERIA",
        title: "Hygiene by JMP service levels",
        options: [
          {
            name: "Basic",
            score: 10,
            color: "#753780",
            options: [
              {
                question: 466680043,
                option: [
                  "Fixed facility observed (sink/tap) In dwelling",
                  "Fixed facility observed (sink/tap)  In yard/plot",
                  "Mobile object observed (bucket/jug/kettle)",
                ],
              },
              {
                question: 466680045,
                option: ["Water is available"],
              },
              {
                question: 466760036,
                option: ["Soap or detergent available."],
              },
            ],
          },
          {
            name: "Limited",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 466680043,
                option: [
                  "Fixed facility observed (sink/tap) In dwelling",
                  "Fixed facility observed (sink/tap)  In yard/plot",
                  "Mobile object observed (bucket/jug/kettle)",
                ],
              },
              {
                question: 466680045,
                option: ["Water is available"],
              },
              {
                question: 466760036,
                option: ["Soap or detergent available ."],
              },
            ],
          },
          {
            name: "No Facility",
            score: -2,
            color: "#F1AC2A",
            options: [
              {
                question: 466680043,
                option: [
                  "No handwashing place in dwelling/yard/plot",
                  "No permission to see",
                ],
              },
            ],
          },
        ],
      },
      {
        form_id: 519630048,
        type: "CRITERIA",
        title: "Menstrual hygiene by JMP service levels",
        options: [
          {
            name: "Awareness",
            color: "#368541",
            score: 15,
            options: [],
          },
          {
            name: "Use of menstrual materials",
            score: 10,
            color: "#79BE7D",
            options: [
              {
                question: 524810057,
                option: [
                  "Cloth/reusable sanitary pads",
                  "Disposable sanitary pads",
                  "Tampons",
                  "Menstrual cup",
                ],
              },
            ],
          },
          {
            name: "Access",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 524810054,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "Participation",
            score: -2,
            color: "#FBD256",
            options: [
              {
                question: 524810053,
                option: [
                  "Attending school",
                  "Paid work",
                  "Participating in social activities",
                  "Cooking food?",
                  "Cooking food",
                  "Eating with others",
                  "Bathing in regular place",
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

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

  test("test if clicking on a tab change the map", async () => {
    const { baseElement, container, getByText } = render(
      <Home highlights={highlights} />
    );
    const tab = container.querySelector(".ant-tabs-tab");
    fireEvent.click(tab);
    await waitFor(() => {
      expect(tab).toHaveClass("ant-tabs-tab-active");
      expect(getByText("Description text here")).toBeInTheDocument();
    });
    expect(baseElement).toMatchSnapshot();
  });

  test("test if Map and Charts exist", () => {
    const wrapper = render(<Home highlights={highlights} />);
    expect(wrapper.container).toMatchSnapshot();
  });

  test("test if partners are in the document", () => {
    const { container, getByTestId } = render(<Home highlights={highlights} />);
    expect(screen.getByText("Partners")).toBeInTheDocument();
    expect(getByTestId(1)).toContainHTML("img");
    expect(container.querySelector(".ant-image-img")).toHaveAttribute(
      "src",
      "/assets/partners/us-aid.png"
    );
  });
});
