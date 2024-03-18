/* eslint-disable react/no-unknown-property */
import React from 'react';
import { Platform, ToastAndroid } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import FormPage from '../FormPage';
import crudDataPoints from '../../database/crud/crud-datapoints';
import { UserState, FormState } from '../../store';
import { getCurrentTimestamp } from '../../form/lib';

jest.useFakeTimers();

const mockRoute = {
  params: { id: 1, name: 'Form Name', newSubmission: true },
};
const mockNavigation = {
  navigate: jest.fn(),
  canGoBack: jest.fn(() => Promise.resolve(true)),
  goBack: jest.fn(),
};
const mockValues = {
  name: 'John',
  geo: null,
  answers: {
    1: 'John',
    2: new Date('01-01-1992'),
    3: '31',
    4: ['male'],
    6: ['traveling'],
    7: ['fried_rice'],
  },
};
const exampleTestForm = {
  name: 'Testing Form',
  languages: ['en', 'id'],
  defaultLanguage: 'en',
  translations: [
    {
      name: 'Formulir untuk Testing',
      language: 'id',
    },
  ],
  question_group: [
    {
      name: 'registration',
      label: 'Registration',
      order: 1,
      translations: [
        {
          name: 'Registrasi',
          language: 'id',
        },
      ],
      question: [
        {
          id: 1,
          name: 'your_name',
          label: 'Your Name',
          order: 1,
          type: 'input',
          required: true,
          meta: true,
          translations: [
            {
              name: 'Nama Anda',
              language: 'id',
            },
          ],
          addonBefore: 'Name',
        },
        {
          id: 2,
          name: 'birth_date',
          label: 'Birth Date',
          order: 2,
          type: 'date',
          required: true,
          translations: [
            {
              name: 'Tanggal Lahir',
              language: 'id',
            },
          ],
        },
        {
          id: 3,
          name: 'age',
          label: 'Age',
          order: 3,
          type: 'number',
          required: true,
          translations: [
            {
              name: 'Umur',
              language: 'id',
            },
          ],
        },
        {
          id: 4,
          name: 'gender',
          label: 'Gender',
          order: 4,
          type: 'option',
          required: true,
          option: [
            {
              id: 1,
              label: 'Male',
              value: 'male',
              order: 1,
            },
            {
              id: 2,
              label: 'Female',
              value: 'female',
              order: 2,
            },
          ],
          meta: false,
          translations: [
            {
              name: 'Jenis Kelamin',
              language: 'id',
            },
          ],
        },
        {
          id: 6,
          name: 'hobby',
          label: 'Hobby',
          order: 2,
          type: 'multiple_option',
          required: false,
          option: [
            {
              id: 21,
              label: 'Reading',
              value: 'reading',
              order: 1,
            },
            {
              id: 22,
              label: 'Traveling',
              value: 'traveling',
              order: 2,
            },
            {
              id: 23,
              label: 'Programming',
              value: 'programming',
              order: 3,
            },
          ],
        },
        {
          id: 7,
          name: 'Foods',
          label: 'Foods',
          order: 3,
          type: 'option',
          required: false,
          option: [
            {
              id: 31,
              label: 'fried_rice',
              value: 'fried_rice',
              order: 1,
            },
            {
              id: 32,
              label: 'Rendang',
              value: 'rendang',
              order: 2,
            },
            {
              id: 33,
              label: 'Noodle',
              value: 'noodle',
              order: 3,
            },
          ],
        },
        {
          id: 8,
          name: 'comment',
          label: 'Comment',
          order: 4,
          type: 'text',
          required: false,
          translations: [
            {
              name: 'Kommentar',
              language: 'id',
            },
          ],
        },
        {
          id: 9,
          name: 'give_rating_rendang',
          label: 'Give Rating from 1 - 9 for Rendang',
          order: 5,
          type: 'number',
          required: true,
          dependency: [
            {
              id: 7,
              options: ['rendang'],
            },
          ],
          rule: {
            min: 1,
            max: 9,
            allowDecimal: true,
          },
          addonAfter: 'Score',
        },
      ],
    },
  ],
};

jest.mock('../../database/crud/crud-datapoints');

describe('FormPage handleOnSubmitForm', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1634123456789);
    FormState.update((s) => {
      s.surveyDuration = 0;
      s.form = {
        json: JSON.stringify(exampleTestForm).replace(/'/g, "''"),
      };
    });
  });

  test('should call handleOnSubmitForm with the correct values when the form is submitted', async () => {
    Platform.OS = 'android';
    ToastAndroid.show = jest.fn();
    act(() => {
      FormState.update((s) => {
        s.surveyStart = getCurrentTimestamp() - 90;
        s.currentValues = mockValues.answers;
      });
    });

    const wrapper = render(<FormPage navigation={mockNavigation} route={mockRoute} />);

    act(() => {
      UserState.update((s) => {
        s.id = 1;
      });
      FormState.update((s) => {
        s.surveyDuration = 9;
      });
    });

    const submitButton = wrapper.getByTestId('form-btn-submit');
    fireEvent.press(submitButton);

    // save datapoint to database
    await waitFor(() => {
      expect(crudDataPoints.saveDataPoint).toHaveBeenCalledWith({
        duration: 10,
        form: 1,
        json: {
          1: 'John',
          2: new Date('01-01-1992'),
          3: 31,
          4: ['male'],
          6: ['traveling'],
          7: ['fried_rice'],
        },
        name: 'John',
        geo: null,
        submitted: 1,
        user: 1,
      });
    });

    expect(ToastAndroid.show).toHaveBeenCalledTimes(1);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Home', mockRoute.params);
  });
});
