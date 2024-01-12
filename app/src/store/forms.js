import { Store } from 'pullstate';

const FormState = new Store({
  form: {},
  currentValues: {}, // answers
  visitedQuestionGroup: [], // to store visited question group id
  surveyDuration: 0,
  surveyStart: null,
  cascades: {},
  lang: 'en',
});

export default FormState;
