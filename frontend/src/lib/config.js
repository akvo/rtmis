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
      description:
        "Overall national administrator of the RTMIS. Assigns roles to all county admins",
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
      ],
      administration_level: [2],
      description:
        "Overall County administrator of the RTMIS. Assigns roles to all sub county RTMIS admins (approvers) in the county under jusridistion.",
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
      ],
      administration_level: [3, 4],
      description:
        "Gives final approval to data submitted from the area under jurisdiction. Can edit or return data for correction.",
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
      ],
      administration_level: [4],
      description:
        "Overall role to collect data from community/village assigned to them",
    },
    {
      id: 5,
      name: "Institutional User",
      filter_form: false,
      page_access: ["profile", "visualisation"],
      administration_level: [1, 2, 3, 4],
      description: "Can view and download data from all counties",
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
