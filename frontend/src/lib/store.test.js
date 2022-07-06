import "@testing-library/jest-dom";
import store from "./store";
import { sortArray } from "../util/form";

describe("Store", () => {
  test("check the initial state", () => {
    const state = {
      isLoggedIn: false,
      user: null,
      filters: {
        trained: null,
        role: null,
        organisation: null,
      },
      language: {
        active: "en",
        langs: { en: "English", de: "German" },
      },
      administration: [],
      selectedAdministration: null,
      loadingMap: false,
      forms: window.forms.sort(sortArray),
      levels: window.levels,
      selectedForm: null,
      loadingForm: false,
      questionGroups: [],
      showAdvancedFilters: false,
      advancedFilters: [],
      administrationLevel: null,
    };
    expect(store).toHaveProperty("initialState", state);
  });
});
