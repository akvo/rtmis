const config = {
  siteTitle: "Ministry of Health",
  siteLogo: "/logo.png",
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
      ],
      administration_level: [1],
    },
    {
      id: 2,
      name: "Admin",
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
      ],
      administration_level: [2],
    },
    {
      id: 3,
      name: "Approver",
      filter_form: 1,
      page_access: [
        "profile",
        "control-center",
        "data",
        "visualisation",
        "approvals",
        "questionnaires",
      ],
      administration_level: [3, 4],
    },
    {
      id: 4,
      name: "User",
      filter_form: 1,
      page_access: ["profile", "form", "data"],
      administration_level: [4],
    },
    {
      id: 5,
      name: "Institutional User",
      filter_form: false,
      page_access: [
        "profile",
        "data",
        "visualisation",
        "approvals",
        "questionnaires",
      ],
      region: [], // we can add our regions here for checking the region
      administration_level: [4],
    },
  ],
  checkAccess: (roles, page) => {
    return roles?.page_access?.includes(page);
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
};

export default config;
