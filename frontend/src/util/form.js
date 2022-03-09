import { api, store, config } from "../lib";

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

export const getFormUrl = ({ role }) => {
  const form_filter = config.roles.find((r) => r.id === role?.id)?.filter_form;
  if (form_filter) {
    return `forms/?type=${form_filter}`;
  }
  return `forms`;
};
