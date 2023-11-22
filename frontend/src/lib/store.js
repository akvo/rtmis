import { Store } from "pullstate";
import { sortArray } from "../util/form";
import config from "./config";

const defaultUIState = {
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
  administration: [config.fn.administration(1)],
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
  showContactFormModal: false,
  mobileAssignment: {},
  /**
   * Dummy new item/edit item in master data
   */
  masterData: {
    administration: {},
    attribute: {},
    entity: {},
  },
};

const store = new Store(defaultUIState);

export default store;
