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
            name: "No toilet observed"
          },
          {
            id: 698,
            name: "Toilet with inadequate privacy"
          },
          {
            id: 699,
            name: "Toilet not functional"
          },
          {
            id: 700,
            name: "Functional toilet with privacy"
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
        type: "PIE",
        id: 444670046,
        title: "Survey Participation",
      },
      {
        type: "BAR",
        id: 517600057,
        title: "Household head's gender",
        options: [
          {
            name: "Male",
            title: "M",
          },
          {
            name: "Female",
            title: "F",
          }
        ],
      },
      {
        type: "BAR",
        id: 519660052,
        title: "Residential Status",
        // horizontal: false,
        options: [
          {
            name: "Permanent",
            color: "cyan", // Eg. set option color in config
          },
        ],
      },
      {
        type: "PIE",
        id: 513690065,
        title: "Toilet facility location",
        options: [
          {
            name: "Elsewhere",
            color: "orange", // Eg. set and override default color in config
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
            "id": 1158,
            "name": "L1"
          },
          {
            "id": 1159,
            "name": "L2"
          },
        ],
      },
      shape: {
        id: 555370007,
        title: "Number of usable toilets",
      },
    },
    charts: [],
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
            name: "Open Defecation"
          },
          {
            id: 891,
            name: "Triggered"
          },
          {
            id: 892,
            name: "Declared ODF"
          },
          {
            id: 893,
            name: "Verified ODF"
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
        type: "PIE",
        id: 543080036,
        title: "School level",
      },
      {
        type: "BAR",
        id: 551660029,
        title: "Type of student toilets",
      },
      {
        type: "PIE",
        id: 555460005,
        title: "Cleanliness of student toilets",
      },
      {
        type: "BARSTACK",
        id: 539710052,
        title: "Handwashing Facilities available",
        options: [
          {
            name: "No",
            title: "N",
          },
        ],
        stack: {
          id: 539710048,
          title: "Soap and water available at handwashing facility",
          options: [
            {
              name: "Yes, water and soap",
              title: "Water and soap",
            },
            {
              name: "Neither water or soap",
              title: "Neither",
            }
          ],
        },
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
        type: "BAR",
        id: 569070152,
        title: "Abstraction/Pump Equipment",
      },
      {
        type: "BAR",
        id: 571060083,
        title: "Source of Energy",
      },
      {
        type: "BAR",
        id: 571050096,
        title: "Water Source Type",
      },
    ],
  },
];