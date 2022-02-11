import { Store } from "pullstate";

const defaultUIState = {
  isLoggedIn: false,
  user: null,
};

const store = new Store(defaultUIState);

export default store;
