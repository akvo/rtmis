import { Store } from "pullstate";

const defaultUIState = {
  isLoggedIn: false,
  user: null,
  filters: {
    role: null,
    county: {
      id: null,
      options: [],
    },
    subCounty: {
      id: null,
      options: [],
    },
    ward: {
      id: null,
      options: [],
    },
    community: {
      id: null,
      options: [],
    },
  },
};

const store = new Store(defaultUIState);

export default store;
