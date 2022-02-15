import { Store } from "pullstate";

const defaultUIState = {
  isLoggedIn: false,
  user: null,
  filters: {
    role: null,
  },
  administration: [],
  forms: [],
  selectedForm: null,
  questionGroups: [],
};

const store = new Store(defaultUIState);

export default store;
