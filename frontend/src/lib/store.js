import { Store } from "pullstate";

const defaultUIState = {
  isLoggedIn: localStorage.getItem("isLoggedIn")
    ? localStorage.getItem("isLoggedIn")
    : false,
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null,
};

const store = new Store(defaultUIState);

export default store;
