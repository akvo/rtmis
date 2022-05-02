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
    charts: [
      {
        type: "PIE",
        id: 444670046,
        title: "Survey Participation",
        options: [
          {
            id: 685,
            name: "Yes",
          },
          {
            id: 686,
            name: "No",
          }
        ],
      },
      {
        type: "PIE",
        id: 517600057,
        title: "Household head's gender",
        options: [
          {
            id: 692,
            name: "Male",
            title: "M",
          },
          {
            id: 693,
            name: "Female",
            title: "F",
          }
        ],
      },
      {
        type: "PIE",
        id: 519660052,
        title: "Residential Status",
        options: [
          {
            id: 692,
            name: "Permanent",
            color: "cyan",
          },
        ],
      },
      {
        type: "PIE",
        id: 513690065,
        title: "Toilet facility location",
      },
    ],
  },
  {
    id: 952774024,
    title: "Health Facilities",
    type: 1,
    map: {
      marker: {
        id: 974754044,
        title: "Type of Health Center",
        options: [
          {
            id: 851,
            name: "Community clinic"
          },
          {
            id: 852,
            name: "Union health complex"
          },
          {
            id: 853,
            name: "Upazila health complex"
          },
          {
            id: 854,
            name: "Big/Private hospital"
          },
        ],
      },
      shape: {
        id: 1119205561,
        title: "Mobile number", // Replace with more relevant question
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
    id: 976564018,
    title: "WASH in School",
    type: 2,
    map: {
      marker: {
        id: 974764034,
        title: "Type of student toilets at the school",
        options: [
          {
            id: 968,
            name: "Pit latrine without slab/open pit"
          },
          {
            id: 969,
            name: "Pit latrine with slab"
          },
          {
            id: 970,
            name: "Hanging latrine"
          },
          {
            id: 971,
            name: "toilet that flush/poor flush but don't know where"
          },
          {
            id: 972,
            name: "Twinpit offset latrine"
          },
          {
            id: 973,
            name: "Ventilated Improved Pit latrine (VIP)"
          },
          {
            id: 974,
            name: "Composting toilet"
          },
          {
            id: 975,
            name: "Bucket"
          },
          {
            id: 976,
            name: "toilet that flush/poor flush to elsewhere"
          },
          {
            id: 977,
            name: "toilet that flush/poor flush to septic tank"
          },
          {
            id: 978,
            name: "toilet that flush/poor flush to piped sewer system"
          },
        ],
      },
      shape: {
        id: 974754026,
        title: "No. of students enrolled in the school",
      },
    },
    charts: [
      {
        type: "PIE",
        id: 996984031,
        title: "Type of School",
      },
      {
        type: "BAR",
        id: 974764034,
        title: "Type of student toilets",
      },
      {
        type: "PIE",
        id: 980804033,
        title: "Handwashing Facilities available",
      },
      {
        type: "BARSTACK",
        id: 996994037,
        title: "Separate toilets for girls and boys",
        options: [
          {
            id: 979,
            name: "Yes",
            title: "Y",
          },
          {
            id: 980,
            name: "No",
            title: "N",
          }
        ],
        stack: {
          id: 992994039,
          title: "Toilets for girls marked with signs",
          options: [
            {
              id: 981,
              name: "Yes, all of them",
              title: "Yes, all",
            },
            {
              id: 982,
              name: "Yes, but not all of them",
              title: "Yes, but not all",
            },
            {
              id: 983,
              name: "No",
              title: "No",
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
        options: [
          {
            id: 996,
            name: "Deep well with distribution"
          },
          {
            id: 997,
            name: "Hand dug well"
          },
          {
            id: 998,
            name: "Shallow well"
          },
          {
            id: 999,
            name: "Protected spring"
          },
          {
            id: 1000,
            name: "Unprotected spring"
          },
          {
            id: 1001,
            name: "Rainwater collection"
          },
          {
            id: 1002,
            name: "Surface water"
          },
        ],
      },
    ],
  },
];