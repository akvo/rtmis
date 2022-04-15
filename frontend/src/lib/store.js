import { Store } from "pullstate";

const defaultUIState = {
  isLoggedIn: false,
  user: null,
  filters: {
    role: null,
  },
  administration: [],
  loadingAdministration: false,
  forms: window.forms,
  levels: window.levels,
  selectedForm: null,
  loadingForm: false,
  questionGroups: [],
};

const store = new Store(defaultUIState);

export default store;
