import { orderBy } from "lodash";

const config = {
  siteTitle: "RUSH",
  siteSubTitle: "Rural Urban Sanitation and Hygiene",
  siteLogo: "/logo.png",
  trainedStatus: [
    {
      label: "Trained",
      value: true,
    },
    {
      label: "Not Trained",
      value: false,
    },
  ],
  organisationAttributes: [
    {
      id: 1,
      name: "User Organisation",
    },
    {
      id: 2,
      name: "Partnership Organisation",
    },
  ],
  roles: [
    {
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
      control_center_order: [
        "manage-user",
        "manage-data",
        "manage-organisation",
      ],
    },
    {
      id: 2,
      name: "County Admin",
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
      ],
      administration_level: [2],
      description:
        "Overall County administrator of the RUSH. Assigns roles to all sub county RUSH admins (approvers) in the county under jusridistion.",
      control_center_order: ["manage-user", "manage-data", "approvals"],
    },
    {
      id: 3,
      name: "Data Approver",
      filter_form: 1,
      page_access: [
        "profile",
        "control-center",
        "data",
        "visualisation",
        "approvals",
        "questionnaires",
        "reports",
      ],
      administration_level: [3, 4],
      description:
        "Gives final approval to data submitted from the area under jurisdiction. Can edit or return data for correction.",
      control_center_order: ["approvals", "manage-data"],
    },
    {
      id: 4,
      name: "Data Entry Staff",
      filter_form: 1,
      page_access: [
        "profile",
        "form",
        "data",
        "visualisation",
        "control-center",
        "reports",
      ],
      administration_level: [4],
      description:
        "Overall role to collect data from community/village assigned to them",
      control_center_order: ["submission", "manage-data"],
    },
    {
      id: 5,
      name: "Institutional User",
      filter_form: false,
      page_access: ["profile", "visualisation", "reports"],
      administration_level: [1, 2, 3, 4],
      description: "Can view and download data from all counties",
      control_center_order: [],
    },
  ],
  checkAccess: (roles, page) => {
    return roles?.page_access?.includes(page);
  },
  approvalsLiteral: ({ role, administration }) => {
    if (role.id !== 3) {
      return "Approvals";
    }
    if (administration.level === 0 || administration.level === 1) {
      return "Certification";
    }
    if (administration.level === 2) {
      return "Approvals";
    }
    if (administration.level === 3) {
      return "Verification";
    }
  },
  designations: [
    {
      id: 1,
      name: "NSE (National Sanitation Extender)",
    },
    {
      id: 2,
      name: "CSE (County Sanitation Extender)",
    },
    {
      id: 3,
      name: "PPHO (Principal Public Health Officer)",
    },
    {
      id: 4,
      name: "PHO (Public Health Officer)",
    },
    {
      id: 5,
      name: "CPHO (County Public Health Officer)",
    },
    {
      id: 6,
      name: "CWASH (County WASH Officer)",
    },
    {
      id: 7,
      name: "CHA (Community Health Assistant)",
    },
    {
      id: 8,
      name: "CHEW (Community Health Extension Worker)",
    },
    {
      id: 9,
      name: "M&E",
    },
    {
      id: 10,
      name: "IT",
    },
    {
      id: 11,
      name: "System Admin",
    },
  ],
  templates: [
    {
      id: 1,
      formId: 519630048,
      name: "Template 1",
      title: "Sanitation Service Levels",
      charts: [
        {
          type: "PIE",
          id: 513690068,
          title: "Functional Toilet Available",
        },
        {
          type: "BAR",
          id: 492490054,
          title: "Kind of Toilet Facility",
        },
        {
          type: "CRITERIA",
          title: "Sanitation Service Level",
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
      ],
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      footer: {
        title: "Footer title 1",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      },
    },
    {
      id: 2,
      formId: 519630048,
      name: "Template 2",
      title: "Hygiene Service Levels",
      charts: [
        {
          type: "CRITERIA",
          title: "Hygiene Service Level",
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
      ],
      description:
        "Consectetur adipisicing elit. Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      footer: {
        title: "Footer title 2",
        description:
          "Consectetur adipisicing elit. Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      },
    },
    {
      id: 3,
      formId: 519630048,
      name: "Template 3",
      title: "Menstrual Hygiene Service Levels",
      charts: [
        {
          type: "CRITERIA",
          title: "Menstrual Hygiene",
          options: [
            {
              name: "Awareness",
              color: "#368541",
              score: 15,
              options: [],
            },
            {
              name: "Use of mensrual materials",
              score: 10,
              color: "#79BE7D",
              options: [
                // {
                //   question: 524810053,
                //   option: [
                //     "Attending school",
                //     "Paid work",
                //     "Participating in social activities",
                //     "Cooking food?"
                //   ]
                // },
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
      description:
        "Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      footer: {
        title: "Footer title 3",
        description:
          "Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      },
    },

    {
      id: 4,
      formId: 533560002,
      name: "Template 1",
      title: "Sanitation",
      charts: [
        {
          type: "CRITERIA",
          title: "Sanitation",
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
      ],
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      footer: {
        title: "Footer title 1",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      },
    },
    {
      id: 5,
      formId: 533560002,
      name: "Template 2",
      title: "Hygiene (Hand washing)",
      charts: [
        {
          type: "CRITERIA",
          title: "Hygiene (Hand washing)",
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
      ],
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      footer: {
        title: "Footer title 1",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      },
    },

    {
      id: 6,
      formId: 563350033,
      name: "Template 1",
      title: "Drinking water",
      charts: [
        {
          type: "CRITERIA",
          title: "Drinking water",
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
      ],
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      footer: {
        title: "Footer title 1",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      },
    },
    {
      id: 7,
      formId: 563350033,
      name: "Template 2",
      title: "Sanitation",
      charts: [
        {
          type: "CRITERIA",
          title: "Sanitation",
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
      ],
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      footer: {
        title: "Footer title 1",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, sunt corrupti fuga facilis non illo eos. Quae optio illum doloribus provident, non esse libero modi excepturi porro ducimus, voluptatibus tenetur!",
      },
    },
  ],
  fn: {
    administration: (id, withchildren = true) => {
      const useradm = window.dbadm.find((i) => i.id === id);
      if (!withchildren) {
        return useradm;
      }
      const children = window.dbadm.filter((i) => i.parent === useradm.id);
      return {
        ...useradm,
        levelName: window.levels.find((l) => l.level === useradm.level)?.name,
        childLevelName:
          window.levels.find((l) => l.level === useradm.level + 1)?.name ||
          null,
        children: orderBy(children, "name"),
      };
    },
  },
};

export default config;
