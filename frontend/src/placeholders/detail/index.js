import exampleAdm from "./administration.json";
import entitySchool from "./entity-school.json";
import entityHCF from "./entity-hcf.json";

export const fakeDetailApi = (id) => {
  const adms = [1, 2, 3, 4, 5];
  const schs = [6, 7];
  if (adms.includes(id)) {
    return exampleAdm;
  }
  if (schs.includes(id)) {
    return entitySchool;
  }
  return entityHCF;
};
