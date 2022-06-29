/* eslint-disable */
var visualisation = [
  {
    id: 519630048,
    title: "Household",
    type: 1,
    map: {
      marker: {
        id: 513690068,
        title: "Functional household toilet available",
        options: [
          {
            id: 697,
            name: "No toilet observed",
          },
          {
            id: 698,
            name: "Toilet with inadequate privacy",
          },
          {
            id: 699,
            name: "Toilet not functional",
          },
          {
            id: 700,
            name: "Functional toilet with privacy",
          },
        ],
      },
      shape: {
        id: 519660055,
        title: "Age of the household head",
      },
    },
    chartListTitle: "JMP",
    charts: [
      {
        type: "CRITERIA",
        title: "Sanitation service level",
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
            // title: "OD",
            color: "#F1AC2A",
            options: [
              {
                question: 492490054,
                option: ["No facility / Bush / Field"],
              },
            ],
          },
        ],
        // stack: {
        //   options: [
        //     {
        //       name: "805",
        //       title: "805, Baringo", // Eg. Override administration name
        //     },
        //   ],
        // },
      },
      {
        type: "CRITERIA",
        title: "Hygiene service level",
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
                option: ["Soap or detergent available ."],
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
        type: "CRITERIA",
        title: "Menstrual hygiene service level",
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
  {
    id: 533560002,
    title: "Health Facilities",
    type: 1,
    map: {
      marker: {
        id: 547720005,
        title: "Health Center Facility Level",
        options: [
          {
            id: 1158,
            name: "L1",
          },
          {
            id: 1159,
            name: "L2",
          },
        ],
      },
      shape: {
        id: 555370007,
        title: "Number of usable toilets",
      },
    },
    charts: [
      {
        type: "CRITERIA",
        title: "Sanitation service level",
        options: [
          {
            name: "Basic",
            color: "#368541",
            score: 15,
            options: [
              {
                question: 555370004,
                option: [
                  "Flush / Pour-flush toilet to sewer connection",
                  "Flush / Pour-flush toilet to tank or pit",
                  "Pit latrine with slab",
                  "Composting toilet",
                ],
              },
              {
                question: 530250002,
                option: ["Yes"],
              },
              {
                question: 555370009,
                option: ["Yes"],
              },
              {
                question: 555370003,
                option: ["Yes"],
              },
              {
                question: 555370005,
                option: ["Yes"],
              },
              {
                question: 555370006,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "Limited",
            score: 10,
            color: "#79BE7D",
            options: [
              {
                question: 555370004,
                option: [
                  "Flush / Pour-flush toilet to sewer connection",
                  "Flush / Pour-flush toilet to tank or pit",
                  "Pit latrine with slab",
                  "Composting toilet",
                ],
              },
              {
                question: 530250002,
                option: ["No"],
              },
              {
                question: 555370009,
                option: ["No"],
              },
              {
                question: 555370003,
                option: ["No"],
              },
              {
                question: 555370005,
                option: ["No"],
              },
              {
                question: 555370006,
                option: ["No"],
              },
            ],
          },
          {
            name: "No service",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 555370004,
                option: [
                  "Flush / Pour-flush toilet to open drain",
                  "Pit latrine without slab/open pit",
                  "Bucket",
                  "Hanging toilet/latrine",
                  "No toilet/latrine",
                ],
              },
            ],
          },
        ],
      },

      {
        type: "CRITERIA",
        title: "Hygiene (Hand washing) service level",
        options: [
          {
            name: "Basic",
            color: "#368541",
            score: 15,
            options: [
              {
                question: 551560007,
                option: ["Yes"],
              },
              {
                question: 551560004,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "Limited",
            score: 10,
            color: "#79BE7D",
            options: [
              {
                question: 551560007,
                option: [
                  "No, there are hand hygiene facilities at points of care but not functional, or lacking soap and water or alcohol-based hand rub.",
                ],
              },
              {
                question: 551560004,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "No service",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 551560007,
                option: [
                  "No, there are hand hygiene facilities at points of care but not functional, or lacking soap and water or alcohol-based hand rub.",
                  "No, no hand hygiene facilities at points of care",
                ],
              },
              {
                question: 551560004,
                option: [
                  "No, there are handwashing facilities near the toilets but lacking soap and/or water",
                  "No, no handwashing facilities near toilets (within 5 meters)",
                ],
              },
            ],
          },
        ],
      },
      {
        type: "CRITERIA",
        title: "Health care waste management service level",
        options: [
          {
            name: "Basic",
            color: "#368541",
            score: 15,
            options: [
              {
                question: 541950008,
                option: ["Yes, waste is segregated into three labelled bins"],
              },
              {
                question: 541950011,
                option: [
                  "Autoclaved",
                  "Incinerated (two chamber, 850-1000 °C incinerator)",
                  "Incinerated (other)",
                  "Burning in a protected pit",
                  "Not treated, but buried in lined, protected pit",
                  "Not treated, but collected for medical waste disposal off-site",
                ],
              },
              {
                question: 541950005,
                option: [
                  "Autoclaved",
                  "Incinerated (two chamber, 850-1000 °C incinerator)",
                  "Incinerated (other)",
                  "Burning in a protected pit",
                  "Not treated, but buried in lined, protected pit",
                  "Not treated, but collected for medical waste disposal off-site",
                ],
              },
            ],
          },
          {
            name: "Limited",
            score: 10,
            color: "#79BE7D",
            options: [
              {
                question: 541950008,
                option: [
                  "No, bins are present but do not meet all requirements or waste is not correctly segregated",
                ],
              },
              {
                question: 541950011,
                option: [
                  "Autoclaved",
                  "Incinerated (two chamber, 850-1000 °C incinerator)",
                  "Incinerated (other)",
                  "Burning in a protected pit",
                  "Not treated, but buried in lined, protected pit",
                  "Not treated, but collected for medical waste disposal off-site",
                ],
              },
              {
                question: 541950005,
                option: [
                  "Autoclaved",
                  "Incinerated (two chamber, 850-1000 °C incinerator)",
                  "Incinerated (other)",
                  "Burning in a protected pit",
                  "Not treated, but buried in lined, protected pit",
                  "Not treated, but collected for medical waste disposal off-site",
                ],
              },
            ],
          },
          {
            name: "No service",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 541950008,
                option: ["No, bins are not present"],
              },
            ],
          },
        ],
      },
      {
        type: "CRITERIA",
        title: "Environmental cleaning service level",
        options: [
          {
            name: "Basic",
            color: "#368541",
            score: 15,
            options: [
              {
                question: 551560009,
                option: ["Yes"],
              },
              {
                question: 551560005,
                option: ["Yes, all have been trained"],
              },
            ],
          },
          {
            name: "Limited",
            score: 10,
            color: "#79BE7D",
            options: [
              {
                question: 551560009,
                option: ["Yes"],
              },
              {
                question: 551560005,
                option: ["No, some but not all have been trained"],
              },
            ],
          },
          {
            name: "No service",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 551560009,
                option: ["Yes but limited"],
              },
              {
                question: 551560005,
                option: [
                  "No, none have been trained",
                  "No, there are no staff responsible for cleaning",
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 974754029,
    title: "CLTS",
    type: 1,
    map: {
      marker: {
        id: 557700349,
        title: "Open Defecation Status",
        options: [
          {
            id: 890,
            name: "Open Defecation",
          },
          {
            id: 891,
            name: "Triggered",
          },
          {
            id: 892,
            name: "Declared ODF",
          },
          {
            id: 893,
            name: "Verified ODF",
          },
        ],
      },
      shape: {
        id: 567440335,
        title: "Number of households in the Village",
      },
    },
    charts: [],
  },
  {
    id: 563350033,
    title: "WASH in School",
    type: 2,
    map: {
      marker: {
        id: 551660011,
        title: "Main source of drinking water",
      },
      shape: {
        id: 551660016,
        title: "No. of drinking water points",
      },
    },
    charts: [
      {
        type: "CRITERIA",
        title: "Drinking water service level",
        options: [
          {
            name: "Basic",
            score: 10,
            color: "#753780",
            options: [
              {
                question: 551660011,
                option: [
                  "Piped water supply",
                  "Protected well/spring",
                  "Rainwater",
                  "Unprotected well/spring",
                  "Packaged bottled water",
                ],
              },
              {
                question: 551660013,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "Limited",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 551660011,
                option: [
                  "Piped water supply",
                  "Protected well/spring",
                  "Rainwater",
                  "Unprotected well/spring",
                  "Packaged bottled water",
                ],
              },
              {
                question: 551660013,
                option: ["No"],
              },
            ],
          },
          {
            name: "No Service",
            score: -2,
            color: "#F1AC2A",
            options: [
              {
                question: 551660011,
                option: [
                  "Tanker-truck or cart",
                  "Surface water (lake, river, stream)",
                  "No water source",
                ],
              },
            ],
          },
        ],
      },
      {
        type: "CRITERIA",
        title: "Sanitation service level",
        options: [
          {
            name: "Basic",
            score: 10,
            color: "#753780",
            options: [
              {
                question: 551660029,
                option: [
                  "Flush / Pour-flush toilets",
                  "Pit latrines with slab",
                  "Composting toilets",
                ],
              },
              {
                question: 579840064,
                option: ["Yes"],
              },
              {
                question: 555460003,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "Limited",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 551660029,
                option: [
                  "Flush / Pour-flush toilets",
                  "Pit latrines with slab",
                  "Composting toilets",
                ],
              },
              {
                question: 579840064,
                option: ["Yes"],
              },
              {
                question: 555460003,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "No Service",
            score: -2,
            color: "#F1AC2A",
            options: [
              {
                question: 551660029,
                option: [
                  "Pit latrines without slab",
                  "Hanging latrines",
                  "Bucket latrines",
                  "No toilets or latrines",
                ],
              },
            ],
          },
        ],
      },
      {
        type: "CRITERIA",
        title: "Hygiene (handwashing) service level",
        options: [
          {
            name: "Basic",
            score: 10,
            color: "#753780",
            options: [
              {
                question: 539710052,
                option: ["Yes"],
              },
              {
                question: 539710048,
                option: ["Yes, water and soap"],
              },
            ],
          },
          {
            name: "Limited",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 539710052,
                option: ["Yes"],
              },
              {
                question: 539710048,
                option: ["Water only"],
              },
            ],
          },
          {
            name: "No Service",
            score: -2,
            color: "#F1AC2A",
            options: [
              {
                question: 539710052,
                option: ["No"],
              },
            ],
          },
        ],
      },
      {
        type: "CRITERIA",
        title: "Hygiene (MHM) service level",
        options: [
          {
            name: "Awareness",
            score: 10,
            color: "#753780",
            options: [],
          },
          {
            name: "Use menstrual materials",
            score: -1,
            color: "#FDF177",
            options: [],
          },
          {
            name: "Access",
            score: -2,
            color: "#F1AC2A",
            options: [
              {
                question: 538000047,
                option: [
                  "Private place / latrine",
                  "Water",
                  "Sanitary pads/cloth",
                  "Soap",
                ],
              },
            ],
          },
          {
            name: "Participation",
            score: -2,
            color: "#368541",
            options: [
              {
                question: 538000047,
                option: [
                  "Private place / latrine",
                  "Water",
                  "Sanitary pads/cloth",
                  "Soap",
                ],
              },
            ],
          },
        ],
      },
      {
        type: "CRITERIA",
        title: "Enviromental cleaning service level",
        options: [
          {
            name: "Basic",
            score: 10,
            color: "#753780",
            options: [
              {
                question: 545530057,
                option: ["Yes"],
              },
              {
                question: 575740004,
                option: ["Yes, all have been trained"],
              },
            ],
          },
          {
            name: "Limited",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 545530057,
                option: ["Yes"],
              },
              {
                question: 575740004,
                option: ["No, some but not all have been trained"],
              },
            ],
          },
          {
            name: "No service",
            score: -2,
            color: "#F1AC2A",
            options: [
              {
                question: 545530057,
                option: ["No"],
              },
              {
                question: 575740004,
                option: [
                  "No, none have been trained",
                  "No, there are no staff responsible for cleaning",
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 571070071,
    title: "Water System",
    type: 2,
    map: {
      marker: {
        id: 571050096,
        title: "Water Source Type",
      },
      shape: {
        id: 555960249,
        title: "Number of functional taps",
      },
    },
    charts: [
      {
        type: "PIE",
        id: 557710145,
        title: "Water System installed by",
      },
      {
        type: "PIE",
        id: 569070152,
        title: "Abstraction/Pump Equipment",
      },
      {
        type: "PIE",
        id: 571060083,
        title: "Source of Energy",
      },
      {
        type: "PIE",
        id: 571050096,
        title: "Water Source Type",
      },
    ],
  },
];

var highlights = [
  {
    name: "Household",
    description: "Description text here",
    map: {
      form_id: 519630048,
      marker: {
        id: 513690068,
        title: "Functional household toilet available",
        options: [
          {
            id: 697,
            name: "No toilet observed",
          },
          {
            id: 698,
            name: "Toilet with inadequate privacy",
          },
          {
            id: 699,
            name: "Toilet not functional",
          },
          {
            id: 700,
            name: "Functional toilet with privacy",
          },
        ],
      },
      shape: {
        id: 519660055,
        title: "Age of the household head",
      },
    },
    charts: [
      {
        // api chart/overview/criteria
        form_id: 519630048,
        type: "CRITERIA",
        title: "Sanitation service level",
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
        title: "Hygiene service level",
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
                option: ["Soap or detergent available ."],
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
        title: "Menstrual hygiene service level",
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
  {
    name: "Health Facilities",
    description: "Description text here",
    map: {
      form_id: 533560002,
      marker: {
        id: 547720005,
        title: "Health Center Facility Level",
        options: [
          {
            id: 1158,
            name: "L1",
          },
          {
            id: 1159,
            name: "L2",
          },
        ],
      },
      shape: {
        id: 555370007,
        title: "Number of usable toilets",
      },
    },
    charts: [
      {
        form_id: 533560002,
        type: "CRITERIA",
        title: "Sanitation service level",
        options: [
          {
            name: "Basic",
            color: "#368541",
            score: 15,
            options: [
              {
                question: 555370004,
                option: [
                  "Flush / Pour-flush toilet to sewer connection",
                  "Flush / Pour-flush toilet to tank or pit",
                  "Pit latrine with slab",
                  "Composting toilet",
                ],
              },
              {
                question: 530250002,
                option: ["Yes"],
              },
              {
                question: 555370009,
                option: ["Yes"],
              },
              {
                question: 555370003,
                option: ["Yes"],
              },
              {
                question: 555370005,
                option: ["Yes"],
              },
              {
                question: 555370006,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "Limited",
            score: 10,
            color: "#79BE7D",
            options: [
              {
                question: 555370004,
                option: [
                  "Flush / Pour-flush toilet to sewer connection",
                  "Flush / Pour-flush toilet to tank or pit",
                  "Pit latrine with slab",
                  "Composting toilet",
                ],
              },
              {
                question: 530250002,
                option: ["No"],
              },
              {
                question: 555370009,
                option: ["No"],
              },
              {
                question: 555370003,
                option: ["No"],
              },
              {
                question: 555370005,
                option: ["No"],
              },
              {
                question: 555370006,
                option: ["No"],
              },
            ],
          },
          {
            name: "No service",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 555370004,
                option: [
                  "Flush / Pour-flush toilet to open drain",
                  "Pit latrine without slab/open pit",
                  "Bucket",
                  "Hanging toilet/latrine",
                  "No toilet/latrine",
                ],
              },
            ],
          },
        ],
      },

      {
        form_id: 533560002,
        type: "CRITERIA",
        title: "Hygiene (Hand washing) service level",
        options: [
          {
            name: "Basic",
            color: "#368541",
            score: 15,
            options: [
              {
                question: 551560007,
                option: ["Yes"],
              },
              {
                question: 551560004,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "Limited",
            score: 10,
            color: "#79BE7D",
            options: [
              {
                question: 551560007,
                option: [
                  "No, there are hand hygiene facilities at points of care but not functional, or lacking soap and water or alcohol-based hand rub.",
                ],
              },
              {
                question: 551560004,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "No service",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 551560007,
                option: [
                  "No, there are hand hygiene facilities at points of care but not functional, or lacking soap and water or alcohol-based hand rub.",
                  "No, no hand hygiene facilities at points of care",
                ],
              },
              {
                question: 551560004,
                option: [
                  "No, there are handwashing facilities near the toilets but lacking soap and/or water",
                  "No, no handwashing facilities near toilets (within 5 meters)",
                ],
              },
            ],
          },
        ],
      },
      {
        form_id: 533560002,
        type: "CRITERIA",
        title: "Health care waste management service level",
        options: [
          {
            name: "Basic",
            color: "#368541",
            score: 15,
            options: [
              {
                question: 541950008,
                option: ["Yes, waste is segregated into three labelled bins"],
              },
              {
                question: 541950011,
                option: [
                  "Autoclaved",
                  "Incinerated (two chamber, 850-1000 °C incinerator)",
                  "Incinerated (other)",
                  "Burning in a protected pit",
                  "Not treated, but buried in lined, protected pit",
                  "Not treated, but collected for medical waste disposal off-site",
                ],
              },
              {
                question: 541950005,
                option: [
                  "Autoclaved",
                  "Incinerated (two chamber, 850-1000 °C incinerator)",
                  "Incinerated (other)",
                  "Burning in a protected pit",
                  "Not treated, but buried in lined, protected pit",
                  "Not treated, but collected for medical waste disposal off-site",
                ],
              },
            ],
          },
          {
            name: "Limited",
            score: 10,
            color: "#79BE7D",
            options: [
              {
                question: 541950008,
                option: [
                  "No, bins are present but do not meet all requirements or waste is not correctly segregated",
                ],
              },
              {
                question: 541950011,
                option: [
                  "Autoclaved",
                  "Incinerated (two chamber, 850-1000 °C incinerator)",
                  "Incinerated (other)",
                  "Burning in a protected pit",
                  "Not treated, but buried in lined, protected pit",
                  "Not treated, but collected for medical waste disposal off-site",
                ],
              },
              {
                question: 541950005,
                option: [
                  "Autoclaved",
                  "Incinerated (two chamber, 850-1000 °C incinerator)",
                  "Incinerated (other)",
                  "Burning in a protected pit",
                  "Not treated, but buried in lined, protected pit",
                  "Not treated, but collected for medical waste disposal off-site",
                ],
              },
            ],
          },
          {
            name: "No service",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 541950008,
                option: ["No, bins are not present"],
              },
            ],
          },
        ],
      },
      {
        form_id: 533560002,
        type: "CRITERIA",
        title: "Environmental cleaning service level",
        options: [
          {
            name: "Basic",
            color: "#368541",
            score: 15,
            options: [
              {
                question: 551560009,
                option: ["Yes"],
              },
              {
                question: 551560005,
                option: ["Yes, all have been trained"],
              },
            ],
          },
          {
            name: "Limited",
            score: 10,
            color: "#79BE7D",
            options: [
              {
                question: 551560009,
                option: ["Yes"],
              },
              {
                question: 551560005,
                option: ["No, some but not all have been trained"],
              },
            ],
          },
          {
            name: "No service",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 551560009,
                option: ["Yes but limited"],
              },
              {
                question: 551560005,
                option: [
                  "No, none have been trained",
                  "No, there are no staff responsible for cleaning",
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "CLTS",
    description: "Description text here",
    map: {
      form_id: 974754029,
      marker: {
        id: 557700349,
        title: "Open Defecation Status",
        options: [
          {
            id: 890,
            name: "Open Defecation",
          },
          {
            id: 891,
            name: "Triggered",
          },
          {
            id: 892,
            name: "Declared ODF",
          },
          {
            id: 893,
            name: "Verified ODF",
          },
        ],
      },
      shape: {
        id: 567440335,
        title: "Number of households in the Village",
      },
    },
    charts: [
      {
        // api chart/overview
        form_id: 974754029,
        type: "PIE",
        id: 494780324,
        title: "Implementing partner",
      },
      {
        form_id: 974754029,
        type: "PIE",
        id: 569090299,
        title: "Presence of Handwashing Facility with Water and Soap",
      },
      {
        form_id: 974754029,
        type: "PIE",
        id: 557710260,
        title: "School Children had Access to Toilets in the Schools",
      },
    ],
  },
  {
    name: "WASH in School",
    description: "Description text here",
    map: {
      form_id: 563350033,
      marker: {
        id: 551660011,
        title: "Main source of drinking water",
        options: [
          {
            id: 511,
            name: "Piped water supply",
          },
          {
            id: 512,
            name: "Protected well/spring",
          },
          {
            id: 513,
            name: "Rainwater",
          },
          {
            id: 514,
            name: "Unprotected well/spring",
          },
          {
            id: 515,
            name: "Packaged bottled water",
          },
          {
            id: 516,
            name: "Tanker-truck or cart",
          },
          {
            id: 517,
            name: "Surface water (lake, river, stream)",
          },
          {
            id: 518,
            name: "No water source",
          },
        ],
      },
      shape: {
        id: 551660016,
        title: "No. of drinking water points",
      },
    },
    charts: [
      {
        form_id: 563350033,
        type: "CRITERIA",
        title: "Drinking water service level",
        options: [
          {
            name: "Basic",
            score: 10,
            color: "#753780",
            options: [
              {
                question: 551660011,
                option: [
                  "Piped water supply",
                  "Protected well/spring",
                  "Rainwater",
                  "Unprotected well/spring",
                  "Packaged bottled water",
                ],
              },
              {
                question: 551660013,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "Limited",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 551660011,
                option: [
                  "Piped water supply",
                  "Protected well/spring",
                  "Rainwater",
                  "Unprotected well/spring",
                  "Packaged bottled water",
                ],
              },
              {
                question: 551660013,
                option: ["No"],
              },
            ],
          },
          {
            name: "No Service",
            score: -2,
            color: "#F1AC2A",
            options: [
              {
                question: 551660011,
                option: [
                  "Tanker-truck or cart",
                  "Surface water (lake, river, stream)",
                  "No water source",
                ],
              },
            ],
          },
        ],
      },
      {
        form_id: 563350033,
        type: "CRITERIA",
        title: "Sanitation service level",
        options: [
          {
            name: "Basic",
            score: 10,
            color: "#753780",
            options: [
              {
                question: 551660029,
                option: [
                  "Flush / Pour-flush toilets",
                  "Pit latrines with slab",
                  "Composting toilets",
                ],
              },
              {
                question: 579840064,
                option: ["Yes"],
              },
              {
                question: 555460003,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "Limited",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 551660029,
                option: [
                  "Flush / Pour-flush toilets",
                  "Pit latrines with slab",
                  "Composting toilets",
                ],
              },
              {
                question: 579840064,
                option: ["Yes"],
              },
              {
                question: 555460003,
                option: ["Yes"],
              },
            ],
          },
          {
            name: "No Service",
            score: -2,
            color: "#F1AC2A",
            options: [
              {
                question: 551660029,
                option: [
                  "Pit latrines without slab",
                  "Hanging latrines",
                  "Bucket latrines",
                  "No toilets or latrines",
                ],
              },
            ],
          },
        ],
      },
      {
        form_id: 563350033,
        type: "CRITERIA",
        title: "Hygiene (handwashing) service level",
        options: [
          {
            name: "Basic",
            score: 10,
            color: "#753780",
            options: [
              {
                question: 539710052,
                option: ["Yes"],
              },
              {
                question: 539710048,
                option: ["Yes, water and soap"],
              },
            ],
          },
          {
            name: "Limited",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 539710052,
                option: ["Yes"],
              },
              {
                question: 539710048,
                option: ["Water only"],
              },
            ],
          },
          {
            name: "No Service",
            score: -2,
            color: "#F1AC2A",
            options: [
              {
                question: 539710052,
                option: ["No"],
              },
            ],
          },
        ],
      },
      {
        form_id: 563350033,
        type: "CRITERIA",
        title: "Hygiene (MHM) service level",
        options: [
          {
            name: "Awareness",
            score: 10,
            color: "#753780",
            options: [],
          },
          {
            name: "Use menstrual materials",
            score: -1,
            color: "#FDF177",
            options: [],
          },
          {
            name: "Access",
            score: -2,
            color: "#F1AC2A",
            options: [
              {
                question: 538000047,
                option: [
                  "Private place / latrine",
                  "Water",
                  "Sanitary pads/cloth",
                  "Soap",
                ],
              },
            ],
          },
          {
            name: "Participation",
            score: -2,
            color: "#368541",
            options: [
              {
                question: 538000047,
                option: [
                  "Private place / latrine",
                  "Water",
                  "Sanitary pads/cloth",
                  "Soap",
                ],
              },
            ],
          },
        ],
      },
      {
        form_id: 563350033,
        type: "CRITERIA",
        title: "Enviromental cleaning service level",
        options: [
          {
            name: "Basic",
            score: 10,
            color: "#753780",
            options: [
              {
                question: 545530057,
                option: ["Yes"],
              },
              {
                question: 575740004,
                option: ["Yes, all have been trained"],
              },
            ],
          },
          {
            name: "Limited",
            score: -1,
            color: "#FDF177",
            options: [
              {
                question: 545530057,
                option: ["Yes"],
              },
              {
                question: 575740004,
                option: ["No, some but not all have been trained"],
              },
            ],
          },
          {
            name: "No service",
            score: -2,
            color: "#F1AC2A",
            options: [
              {
                question: 545530057,
                option: ["No"],
              },
              {
                question: 575740004,
                option: [
                  "No, none have been trained",
                  "No, there are no staff responsible for cleaning",
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Water System",
    description: "Description text here",
    map: {
      form_id: 571070071,
      marker: {
        id: 571050096,
        title: "Water Source Type",
        options: [
          {
            id: 346,
            name: "Deep well with distribution",
          },
          {
            id: 347,
            name: "Hand dug well",
          },
          {
            id: 348,
            name: "Shallow well",
          },
          {
            id: 349,
            name: "Protected spring",
          },
          {
            id: 350,
            name: "Unprotected spring",
          },
          {
            id: 351,
            name: "Rainwater collection",
          },
          {
            id: 352,
            name: "Surface water",
          },
        ],
      },
      shape: {
        id: 555960249,
        title: "Number of functional taps",
      },
    },
    charts: [
      {
        // api chart/overview
        form_id: 571070071,
        type: "PIE",
        id: 557710145,
        title: "Water System installed by",
      },
      {
        form_id: 571070071,
        type: "PIE",
        id: 569070152,
        title: "Abstraction/Pump Equipment",
      },
      {
        form_id: 571070071,
        type: "PIE",
        id: 571060083,
        title: "Source of Energy",
      },
      {
        form_id: 571070071,
        type: "PIE",
        id: 571050096,
        title: "Water Source Type",
      },
    ],
  },
];
