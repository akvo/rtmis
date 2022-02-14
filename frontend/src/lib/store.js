import { Store } from "pullstate";

const defaultUIState = {
  isLoggedIn: false,
  user: null,
  filters: {
    role: null,
  },
  administration: [],
};

const store = new Store(defaultUIState);

export default store;
