import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import FormContainer from '../FormContainer';
import { FormState } from '../../store';

jest.useFakeTimers();
jest.mock('expo-font');
jest.mock('expo-asset');

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
      name: 'Registration',
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
          name: 'Your Name',
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
          name: 'Birth Date',
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
          name: 'Age',
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
          name: 'Gender',
          order: 4,
          type: 'option',
          required: true,
          option: [
            {
              id: 1,
              name: 'Male',
              order: 1,
            },
            {
              id: 2,
              name: 'Female',
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
          id: 5,
          name: 'Your last education',
          order: 1,
          type: 'option',
          required: false,
          option: [
            {
              id: 11,
              name: 'Senior High School',
              order: 1,
            },
            {
              id: 12,
              name: 'Bachelor',
              order: 2,
            },
            {
              id: 13,
              name: 'Master',
              order: 3,
            },
            {
              id: 14,
              name: 'Doctor',
              order: 4,
            },
          ],
        },
        {
          id: 6,
          name: 'Hobby',
          order: 2,
          type: 'option',
          required: false,
          option: [
            {
              id: 21,
              name: 'Reading',
              order: 1,
            },
            {
              id: 22,
              name: 'Traveling',
              order: 2,
            },
            {
              id: 23,
              name: 'Programming',
              order: 3,
            },
          ],
        },
        {
          id: 7,
          name: 'Foods',
          order: 3,
          type: 'option',
          required: false,
          option: [
            {
              id: 31,
              name: 'Fried Rice',
              order: 1,
            },
            {
              id: 32,
              name: 'Rendang',
              order: 2,
            },
            {
              id: 33,
              name: 'Noodle',
              order: 3,
            },
            {
              id: 34,
              name: 'Meat Ball',
              order: 5,
            },
            {
              id: 35,
              name: 'Fried Chicken',
              order: 6,
            },
          ],
        },
        {
          id: 8,
          name: 'Comment',
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
          name: 'Give Rating from 1 - 9 for Rendang',
          order: 5,
          type: 'number',
          required: true,
          dependency: [
            {
              id: 7,
              options: ['Rendang'],
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

describe('FormContainer component on save', () => {
  test('should return values as null onSave callback if currentValues not defined', async () => {
    const handleOnSave = jest.fn();

    render(<FormContainer forms={exampleTestForm} onSave={handleOnSave} />);

    await waitFor(() => {
      expect(handleOnSave).toHaveBeenCalledTimes(1);
      expect(handleOnSave).toHaveBeenCalledWith(null);
    });
  });

  test('should handle onSave event and return refreshForm', async () => {
    const handleOnSave = jest.fn();

    const modifiedInitialValues = {
      1: 'John',
    };

    act(() => {
      FormState.update((s) => {
        s.currentValues = modifiedInitialValues;
      });
    });

    render(
      <FormContainer
        forms={exampleTestForm}
        initialValues={modifiedInitialValues}
        onSave={handleOnSave}
      />,
    );

    await waitFor(() => {
      expect(handleOnSave).toHaveBeenCalledTimes(1);
      expect(handleOnSave).toHaveBeenCalledWith({
        answers: { 1: 'John' },
        geo: null,
        name: 'John',
      });
      expect(handleOnSave).toHaveBeenCalledWith({
        name: 'John',
        geo: null,
        answers: {
          1: 'John',
        },
      });
    });
  });
});

describe('FormContainer component on submit', () => {
  test('submits form data correctly without dependency', async () => {
    const handleOnSubmit = jest.fn();
    const modifiedInitialValues = {
      1: 'John',
      2: new Date('01-01-1992'),
      3: '31',
      4: ['Male'],
      5: ['Bachelor'],
      6: [undefined, 'Traveling'],
      7: ['Fried Rice'],
      8: ' ',
    };
    act(() => {
      FormState.update((s) => {
        s.currentValues = modifiedInitialValues;
      });
    });

    const { queryByTestId, rerender } = render(
      <FormContainer
        forms={exampleTestForm}
        initialValues={modifiedInitialValues}
        onSubmit={handleOnSubmit}
      />,
    );
    const formSubmitBtn = queryByTestId('form-btn-submit');
    expect(formSubmitBtn).toBeDefined();

    act(() => {
      fireEvent.press(formSubmitBtn);
    });

    rerender(
      <FormContainer
        forms={exampleTestForm}
        initialValues={modifiedInitialValues}
        onSubmit={handleOnSubmit}
      />,
    );

    await waitFor(() => {
      expect(handleOnSubmit).toHaveBeenCalledTimes(1);
      expect(handleOnSubmit).toHaveBeenCalledWith({
        name: 'John',
        geo: null,
        answers: {
          1: 'John',
          2: new Date('01-01-1992'),
          3: '31',
          4: ['Male'],
          5: ['Bachelor'],
          6: ['Traveling'],
          7: ['Fried Rice'],
        },
      });
    });
  });

  test('submits form data correctly with dependency', async () => {
    const handleOnSubmit = jest.fn();
    const modifiedInitialValues = {
      1: 'John',
      2: new Date('01-01-1992'),
      3: '31',
      4: ['Male'],
      5: ['Bachelor'],
      6: [undefined, 'Traveling'],
      7: ['Rendang'],
      9: '8.9',
    };

    act(() => {
      FormState.update((s) => {
        s.currentValues = modifiedInitialValues;
      });
    });

    const { queryByTestId } = render(
      <FormContainer
        forms={exampleTestForm}
        initialValues={modifiedInitialValues}
        onSubmit={handleOnSubmit}
      />,
    );

    const formSubmitBtn = queryByTestId('form-btn-submit');
    expect(formSubmitBtn).toBeDefined();
    fireEvent.press(formSubmitBtn);

    await waitFor(() => expect(handleOnSubmit).toHaveBeenCalledTimes(1));
    expect(handleOnSubmit).toHaveBeenCalledWith({
      name: 'John',
      geo: null,
      answers: {
        1: 'John',
        2: new Date('01-01-1992'),
        3: '31',
        4: ['Male'],
        5: ['Bachelor'],
        6: ['Traveling'],
        7: ['Rendang'],
        9: '8.9',
      },
    });
  });

  it.failing(
    'should filter form values by valid value and respect required validation',
    async () => {
      const handleOnSubmit = jest.fn();
      const modifiedInitialValues = {
        1: '',
        2: new Date('01-01-1992'),
        3: 0,
        4: ['Male'],
        5: ['Bachelor'],
        6: [undefined],
        7: [],
        8: ' ',
        9: 0,
      };

      act(() => {
        FormState.update((s) => {
          s.currentValues = modifiedInitialValues;
        });
      });

      const { queryByTestId } = render(
        <FormContainer
          forms={exampleTestForm}
          initialValues={modifiedInitialValues}
          onSubmit={handleOnSubmit}
        />,
      );

      const formSubmitBtn = queryByTestId('form-btn-submit');
      expect(formSubmitBtn).toBeDefined();
      fireEvent.press(formSubmitBtn);

      await waitFor(() => expect(handleOnSubmit).toHaveBeenCalledTimes(1));
      expect(handleOnSubmit).toHaveBeenCalledWith({
        name: 'John',
        geo: null,
        answers: {
          1: 'John',
          2: new Date('01-01-1992'),
          3: 0,
          4: ['Male'],
          5: ['Bachelor'],
          9: 0,
        },
      });
    },
  );

  it('should filter form values by valid value', async () => {
    const handleOnSubmit = jest.fn();
    const modifiedInitialValues = {
      1: 'John',
      2: new Date('01-01-1992'),
      3: 0,
      4: ['Male'],
      5: ['Bachelor'],
      6: [undefined],
      7: [],
      8: '',
      9: 0,
    };

    act(() => {
      FormState.update((s) => {
        s.currentValues = modifiedInitialValues;
      });
    });

    const { queryByTestId } = render(
      <FormContainer
        forms={exampleTestForm}
        initialValues={modifiedInitialValues}
        onSubmit={handleOnSubmit}
      />,
    );

    const formSubmitBtn = queryByTestId('form-btn-submit');
    expect(formSubmitBtn).toBeDefined();
    fireEvent.press(formSubmitBtn);

    await waitFor(() => expect(handleOnSubmit).toHaveBeenCalledTimes(1));
    expect(handleOnSubmit).toHaveBeenCalledWith({
      name: 'John',
      geo: null,
      answers: {
        1: 'John',
        2: new Date('01-01-1992'),
        3: 0,
        4: ['Male'],
        5: ['Bachelor'],
        9: 0,
      },
    });
  });
});
