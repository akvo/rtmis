import { store, config } from "../lib";

export const sortArray = (x, y) => {
  const nameOne = x.name.toLowerCase();
  const nameTwo = y.name.toLowerCase();
  if (nameOne < nameTwo) {
    return -1;
  }
  if (nameOne > nameTwo) {
    return 1;
  }
  return 0;
};

const filterFormByAssigment = (profile = {}) => {
  if (!Object.keys(profile).length) {
    return window.forms;
  }
  const role_details = config.roles.find((r) => r.id === profile.role.id);
  // filter form by config
  let filterForm = role_details.filter_form
    ? window.forms.filter((x) => x.type === role_details.filter_form)
    : window.forms;
  // if not super admin filter by assignment form
  filterForm =
    role_details.id !== 1
      ? filterForm.filter((x) => profile.forms.map((f) => f.id).includes(x.id))
      : filterForm;
  return filterForm;
};

export const reloadData = (profile = {}, dataset = []) => {
  const filterForms = filterFormByAssigment(profile);
  const updatedForms = dataset.length
    ? filterForms.map((x) => {
        const newForm = dataset.find((d) => d.id === x.id);
        if (newForm) {
          return { ...x, ...newForm };
        }
        return x;
      })
    : filterForms;
  store.update((s) => {
    s.forms = updatedForms;
  });
};
