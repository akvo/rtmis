import { SUBMISSION_TYPES } from '../constants';
import helpers from '../helpers';

describe('helpers tests', () => {
  it('should flip the object correctly', () => {
    const input = SUBMISSION_TYPES.monitoring;
    const expected = 'monitoring';
    const result = helpers.flipObject(SUBMISSION_TYPES)?.[input];

    expect(result).toEqual(expected);
  });

  it('should change the text to capitalize the first letter', () => {
    const input = 'registration';
    const expected = 'Registration';
    const result = helpers.capitalizeFirstLetter(input);

    expect(result).toEqual(expected);
  });
});
