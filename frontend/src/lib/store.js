import { Store } from "pullstate";
import { sortArray } from "../util/form";

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
  administration: [],
  selectedAdministration: null,
  loadingMap: false,
  forms: window.forms.sort(sortArray),
  levels: window.levels,
  selectedForm: null,
  selectedFormData: null,
  loadingForm: false,
  questionGroups: [],
  showAdvancedFilters: false,
  advancedFilters: [],
  administrationLevel: null,
  showContactFormModal: false,
  masterData: {
    administration: {},
    attribute: {},
    entity: {},
  },
  options: {
    entityTypes: [],
  },
  initialValue: [],
};

const store = new Store(defaultUIState);

export default store;
