import { Store } from "pullstate";

const defaultUIState = {
  isLoggedIn: false,
  user: null,
  filters: {
    role: null,
  },
  administration: [],
  selectedAdministration: null,
  loadingAdministration: false,
  loadingMap: false,
  forms: window.forms,
  levels: window.levels,
  selectedForm: null,
  loadingForm: false,
  questionGroups: [],
  showAdvancedFilters: false,
  advancedFilters: [],
  administrationLevel: null,
};

const store = new Store(defaultUIState);

export default store;
