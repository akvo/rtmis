import { api, store } from "../lib";
export const reloadData = () => {
  api
    .get("forms/")
    .then((res) => {
      store.update((s) => {
        s.forms = res.data;
      });
    })
    .catch((err) => {
      console.error(err);
    });
};
