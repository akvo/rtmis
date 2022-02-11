import { Store } from "pullstate";

const defaultUIState = {
  isLoggedIn: false,
  user: null,
  filterRole: null,
  filterRegion: null,
};

const store = new Store(defaultUIState);

export default store;
