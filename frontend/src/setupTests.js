// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

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
