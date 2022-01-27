import { Store } from "pullstate";

const defaultUIState = {
  isLoggedIn: false,
};

const store = new Store(defaultUIState);

export default store;
