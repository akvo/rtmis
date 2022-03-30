import { store } from "../lib";

export const reloadData = (dataset = []) => {
  const updatedForms = dataset.length
    ? window.forms.map((x) => {
        const newForm = dataset.find((d) => d.id === x.id);
        if (newForm) {
          return { ...x, ...newForm };
        }
        return x;
      })
    : window.forms;
  store.update((s) => {
    s.forms = updatedForms;
  });
};
