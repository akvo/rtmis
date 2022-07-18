import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HomeMap } from "../components";

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

const mapValue = [
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
      {
        name: "Open Defecation",
        title: "Open Defecation",
        value: 0,
        color: "#F1AC2A",
        total: 0,
      },
    ],
  },
  {
    name: "Busia",
    title: "Busia",
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
      {
        name: "Open Defecation",
        title: "Open Defecation",
        value: 0,
        color: "#F1AC2A",
        total: 0,
      },
    ],
  },
];

describe("Home map", () => {
  test("test home map", () => {
    const { container } = render(
      <HomeMap
        markerData={{ features: [] }}
        current={highlights?.[0]}
        style={{ height: 532 }}
        mapValues={mapValue}
      />
    );
    expect(container.querySelector("map-container")).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
