// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import "jest-canvas-mock";

window.topojson = { objects: { kenya: { geometries: [{ properties: {} }] } } };
window.levels = [
  { id: 1, name: "National", level: 0 },
  { id: 2, name: "County", level: 1 },
  { id: 3, name: "Sub-County", level: 2 },
  { id: 4, name: "Ward", level: 3 },
];
window.forms = [
  { id: 1, name: "Example 1", type: 1, version: 1, type_text: "County" },
  { id: 2, name: "Example 2", type: 2, version: 1, type_text: "National" },
];

window.visualisation = [];

window.highlights = [];

window.selectedPanels = [
  {
    access: "user",
    buttonLabel: "Manage Users",
    description: null,
    image: "/assets/personal-information.png",
    key: "manage-user",
    link: "/users",
    title: "User Management",
  },
  {
    access: "data",
    buttonLabel: "Manage Data",
    description: null,
    image: "/assets/big-data.png",
    key: "manage-data",
    link: "/data/manage",
    title: "Manage Data",
  },
  {
    access: "organisation",
    buttonLabel: "Manage Organization",
    description: null,
    image: "/assets/organisation.svg",
    key: "manage-organisation",
    link: "/organisations",
    title: "Manage Organization",
  },
];

window.dbadm = [
  {
    full_name: "Indonesia",
    id: 1,
    level: 0,
    name: "Indonesia",
    parent: null,
    path: null,
  },
  {
    full_name: "Indonesia|Jakarta",
    id: 2,
    level: 1,
    name: "Jakarta",
    parent: 1,
    path: "1.",
  },
];

window.mapValue = [
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

window.partners = ["us-aid.png", "japan.png", "unicef.png"];

window.profile = {
  email: "toky@gmail.com",
  name: "Fanilo Toky",
  administration: {
    id: 1,
    name: "Kenya",
    level: 0,
  },
  trained: false,
  role: { id: 1, value: "Super Admin" },
  phone_number: null,
  forms: [],
  organisation: {
    name: "",
  },
  last_login: 1658219467.715176,
  role_detail: {
    id: 1,
    name: "Super Admin",
    filter_form: false,
    page_access: [
      "profile",
      "user",
      "control-center",
      "data",
      "visualisation",
      "questionnaires",
      "approvals",
      "approvers",
      "form",
      "reports",
      "settings",
      "organisation",
    ],
    administration_level: [1],
    description:
      "Overall national administrator of the RUSH. Assigns roles to all county admins",
    control_center_order: ["manage-user", "manage-data", "manage-organisation"],
  },
};

window.filters = {
  trained: false,
  role: 2,
  organisation: 1,
};

window.dataset = [
  {
    id: 1,
    name: "Onja",
    attributes: [
      {
        type_id: 1,
        name: "member",
      },
    ],
    users: 22,
  },
];

window.organisationAttributes = [
  {
    id: 1,
    name: "User Organisation",
  },
  {
    id: 2,
    name: "Partnership Organisation",
  },
];

window.users = [
  {
    id: 134,
    first_name: "Mutha",
    last_name: "User",
    email: "mutha1338@user.com",
    administration: {
      id: 1338,
      name: "Mutha",
      level: 3,
    },
    organisation: {
      id: 1,
      name: "Onja",
    },
    trained: false,
    role: {
      id: 4,
      value: "Data Entry Staff",
    },
    phone_number: null,
    designation: null,
    invite: "MTM0:1oE9Cs:5EWcysOOoL7HeUXV4ehrDEFwiY8btWX0INq2RDlwwlo",
    forms: [
      {
        id: 974754029,
        name: "CLTS",
      },
    ],
    last_login: null,
  },
  {
    id: 133,
    first_name: "Nambale",
    last_name: "Approver",
    email: "nambale255@test.com",
    administration: {
      id: 255,
      name: "Nambale",
      level: 2,
    },
    organisation: {
      id: 1,
      name: "Onja",
    },
    trained: false,
    role: {
      id: 3,
      value: "Data Approver",
    },
    phone_number: null,
    designation: null,
    invite: "MTMz:1oE9Cs:i6d4xCT3Q7o1ZwaR7ol3wZNDcRw6XpyuK65w48HMf5k",
    forms: [
      {
        id: 563350033,
        name: "WASH in Schools",
      },
    ],
    last_login: null,
  },
];

window.forms = [
  {
    name: "CLTS",
    question_group: [
      {
        name: "Location",
        question: [
          {
            id: 9747540291,
            name: "location",
            order: 1,
            type: "cascade",
            required: true,
            api: {
              endpoint: "/api/v1/administration",
              list: "children",
              initial: 1,
            },
            meta: true,
          },
        ],
      },
      {
        name: "Village Information",
        question: [
          {
            id: 569070281,
            name: "Village",
            order: 1,
            type: "text",
            required: true,
            meta: true,
          },
          {
            id: 567440335,
            name: "Number of households in the Village",
            order: 2,
            type: "number",
            required: true,
            meta: false,
          },
          {
            id: 571070201,
            name: "Take GPS Location of Village",
            order: 3,
            type: "geo",
            required: true,
            center: {
              lat: 9.145,
              lng: 40.4897,
            },
            meta: true,
          },
        ],
      },
      {
        name: "CLTS Intervention Information",
        question: [
          {
            id: 494780324,
            name: "Implementing partner",
            order: 1,
            type: "option",
            required: true,
            option: [
              {
                id: 10755,
                name: "Amref",
                order: 1,
              },
              {
                id: 10756,
                name: "Amref and Local Government",
                order: 2,
              },
              {
                id: 10757,
                name: "Other",
                order: 3,
              },
            ],
            meta: false,
          },
          {
            id: 559830326,
            name: "Date Triggered",
            order: 2,
            type: "date",
            required: false,
            meta: false,
          },
          {
            id: 569070282,
            name: "Number of Latrines at Triggering?",
            order: 3,
            type: "number",
            required: false,
            meta: false,
          },
          {
            id: 569090299,
            name: "Presence of Handwashing Facility with Water and Soap",
            order: 4,
            type: "option",
            required: false,
            option: [
              {
                id: 10758,
                name: "Yes",
                order: 1,
              },
              {
                id: 10759,
                name: "No",
                order: 2,
              },
            ],
            meta: false,
          },
          {
            id: 571070202,
            name: "No Visible Feces were Found in Environment",
            order: 5,
            type: "option",
            required: false,
            option: [
              {
                id: 10760,
                name: "Yes",
                order: 1,
              },
              {
                id: 10761,
                name: "No",
                order: 2,
              },
            ],
            meta: false,
          },
          {
            id: 557710260,
            name: "School Children had Access to Toilets in the Schools",
            order: 6,
            type: "option",
            required: false,
            option: [
              {
                id: 10762,
                name: "Yes",
                order: 1,
              },
              {
                id: 10763,
                name: "No",
                order: 2,
              },
            ],
            meta: false,
          },
          {
            id: 573010345,
            name: "Public Toilets were Available in Public Places",
            order: 7,
            type: "option",
            required: false,
            option: [
              {
                id: 10764,
                name: "Yes",
                order: 1,
              },
              {
                id: 10765,
                name: "No",
                order: 2,
              },
            ],
            meta: false,
          },
          {
            id: 557710261,
            name: "Toilets were Available for Passengers",
            order: 8,
            type: "option",
            required: false,
            option: [
              {
                id: 10766,
                name: "Yes",
                order: 1,
              },
              {
                id: 10767,
                name: "No",
                order: 2,
              },
            ],
            meta: false,
          },
          {
            id: 557690351,
            name: "Date Verified",
            order: 9,
            type: "date",
            required: false,
            meta: false,
          },
          {
            id: 569090301,
            name: "Number of Latrines at Verification Date",
            order: 10,
            type: "number",
            required: false,
            meta: false,
          },
          {
            id: 583770042,
            name: "Latrine Type of Most Latrines at Verification Date",
            order: 11,
            type: "option",
            required: true,
            option: [
              {
                id: 10768,
                name: "Bucket",
                order: 1,
              },
              {
                id: 10769,
                name: "Container-based sanitation",
                order: 2,
              },
              {
                id: 10770,
                name: "Flush/pour flush to piped sewer system",
                order: 3,
              },
              {
                id: 10771,
                name: "Flush/pour flush to septic tank",
                order: 4,
              },
              {
                id: 10772,
                name: "Flush/pour flush to pit latrine",
                order: 5,
              },
              {
                id: 10773,
                name: "Flush/pour flush to open drain",
                order: 6,
              },
              {
                id: 10774,
                name: "Hanging toilet/latrine",
                order: 7,
              },
              {
                id: 10775,
                name: "Pit latrine with slab",
                order: 8,
              },
              {
                id: 10776,
                name: "Pit latrine without slab/open pit",
                order: 9,
              },
              {
                id: 10777,
                name: "Twin pit offset latrine",
                order: 10,
              },
              {
                id: 10778,
                name: "Twin pit with latrine slab",
                order: 11,
              },
              {
                id: 10779,
                name: "Twin pit without slab",
                order: 12,
              },
              {
                id: 10780,
                name: "Ventilated improved pit latrine (VIP) with slab",
                order: 13,
              },
              {
                id: 10781,
                name: "Other composting latrine",
                order: 14,
              },
            ],
            meta: false,
          },
          {
            id: 557700349,
            name: "Open Defecation Status",
            order: 12,
            type: "option",
            required: false,
            option: [
              {
                id: 10782,
                name: "Open Defecation",
                order: 1,
              },
              {
                id: 10783,
                name: "Triggered",
                order: 2,
              },
              {
                id: 10784,
                name: "Declared ODF",
                order: 3,
              },
              {
                id: 10785,
                name: "Verified ODF",
                order: 4,
              },
            ],
            meta: false,
          },
        ],
      },
    ],
  },
];

window.filterForms = [];

window.dashboard = [
  {
    name: "Household Data",
    form_id: 519630048,
    page: "dashboard",
    tabs: {
      overview: {
        rows: [
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
        ],
      },
      jmp: {
        rows: [
          [
            {
              type: "card",
              title: "% of HHs with Safely managed sanitation",
              calc: "percent",
              path: "data.sanitation service level.safely managed",
              icon: "safely-managed.svg",
            },
            {
              type: "card",
              title: "% of HHs practising Open defecation",
              calc: "percent",
              path: "data.sanitation service level.open defecation",
            },
            {
              type: "card",
              title: "% of HHs with Basic Hygiene facilities",
              calc: "percent",
              path: "data.hygiene service level.basic",
            },
            {
              type: "card",
              title: "% of HHs with No Hygiene facility",
              calc: "percent",
              path: "data.hygiene service level.no facility",
            },
          ],
          [
            {
              type: "maps",
              title: "% HHs at safely managed sanitation service level",
              calc: "percent",
              path: "data.sanitation service level.safely managed",
              span: 24,
            },
          ],
          [
            {
              type: "chart",
              title: "Sanitation service levels",
              calc: "jmp",
              path: "data.sanitation service level",
              span: 12,
            },
            {
              type: "chart",
              title: "Hygiene service levels",
              calc: "jmp",
              path: "data.hygiene service level",
              span: 12,
            },
          ],
          [
            {
              type: "chart",
              title: "Menstrual Hygiene service levels",
              calc: "jmp",
              path: "data.menstrual hygiene service level",
              span: 24,
            },
          ],
          [
            {
              type: "chart",
              title: "Sanition Service Level by Period",
              selector: "period",
              span: 24,
              path: "jmp.sanitation service level",
            },
            {
              type: "chart",
              title: "Hygiene Service Level by Period",
              selector: "period",
              span: 24,
              path: "jmp.hygiene service level",
            },
            {
              type: "chart",
              title: "Menstrual Hygiene Service Level by Period",
              selector: "period",
              span: 24,
              path: "jmp.menstrual hygiene service level",
            },
          ],
        ],
      },
      rush: {},
    },
  },
];

window.selectedForm = [
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
