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
