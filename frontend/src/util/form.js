import { api, store } from "../lib";

export const reloadData = () => {
  store.update((s) => {
    s.forms = [];
  });
  api
    .get("forms")
    .then((res) => {
      store.update((s) => {
        s.forms = res.data;
      });
    })
    .catch((err) => {
      console.error(err);
    });
};

export const getFormUrl = ({ filter_form }) => {
  if (filter_form) {
    return `forms/?type=${filter_form}`;
  }
  return `forms`;
};
