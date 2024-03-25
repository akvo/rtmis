import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import FormContainer from '../FormContainer';
import { FormState } from '../../store';

jest.useFakeTimers();
jest.mock('expo-font');
jest.mock('expo-asset');
jest.doMock('react-native/Libraries/Utilities/Platform.android.js', () => ({
  OS: 'android',
  select: jest.fn(),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: jest.fn().mockReturnValue({
    params: { submission_type: 'registration' },
  }),
}));

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

describe('FormContainer component on submit', () => {
  beforeAll(() => {
    Platform.OS = 'android';
  });

  it('should show a toast message when the mandatory inputs are still empty', async () => {
    const handleOnSubmit = jest.fn();
    const handleOnShowDialog = jest.fn();
    const { getByTestId, queryByText } = render(
      <FormContainer
        forms={exampleTestForm}
        onSubmit={handleOnSubmit}
        setShowDialogMenu={handleOnShowDialog}
        isMonitoring={false}
      />,
    );

    const submitEl = getByTestId('form-btn-submit');
    expect(submitEl).toBeDefined();
    expect(Platform.OS).toEqual('android');

    act(() => {
      fireEvent.press(submitEl);
    });

    await waitFor(() => {
      expect(handleOnSubmit).toHaveBeenCalledTimes(0);
      expect(queryByText('Please answer all mandatory questions')).toBeDefined();
    });
  });

  it('should submit form data correctly without dependency', async () => {
    const modifiedInitialValues = {
      1: 'John',
      2: new Date('01-01-1992'),
      3: '31',
      4: ['male'],
      6: ['traveling'],
      7: ['fried_rice'],
      8: ' ',
    };
    act(() => {
      FormState.update((s) => {
        s.currentValues = modifiedInitialValues;
      });
    });
    const handleOnSubmit = jest.fn();
    const handleOnShowDialog = jest.fn();
    const { queryByTestId } = render(
      <FormContainer
        forms={exampleTestForm}
        onSubmit={handleOnSubmit}
        setShowDialogMenu={handleOnShowDialog}
        isMonitoring={false}
      />,
    );
    const formSubmitBtn = queryByTestId('form-btn-submit');
    expect(formSubmitBtn).toBeDefined();

    act(() => {
      fireEvent.press(formSubmitBtn);
    });

    await waitFor(() => {
      expect(handleOnSubmit).toHaveBeenCalledTimes(1);
      expect(handleOnSubmit).toHaveBeenCalledWith({
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
      });
    });
  });

  it('should submit form data correctly with dependency', async () => {
    const handleOnSubmit = jest.fn();
    const handleOnShowDialog = jest.fn();
    const modifiedInitialValues = {
      1: 'John',
      2: new Date('01-01-1992'),
      3: '31',
      4: ['male'],
      6: ['traveling'],
      7: ['rendang'],
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
        onSubmit={handleOnSubmit}
        setShowDialogMenu={handleOnShowDialog}
        isMonitoring={false}
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
        4: ['male'],
        6: ['traveling'],
        7: ['rendang'],
        9: '8.9',
      },
    });
  });

  it.failing(
    'should filter form values by valid value and respect required validation',
    async () => {
      const handleOnSubmit = jest.fn();
      const handleOnShowDialog = jest.fn();
      const modifiedInitialValues = {
        1: '',
        2: new Date('01-01-1992'),
        3: '0',
        4: ['male'],
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
          onSubmit={handleOnSubmit}
          setShowDialogMenu={handleOnShowDialog}
          isMonitoring={false}
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
          3: '0',
          4: ['male'],
          9: '0',
        },
      });
    },
  );

  it('should filter form values by valid value', async () => {
    const handleOnSubmit = jest.fn();
    const handleOnShowDialog = jest.fn();
    const modifiedInitialValues = {
      1: 'John',
      2: new Date('01-01-1992'),
      3: '0',
      4: ['male'],
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
        setShowDialogMenu={handleOnShowDialog}
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
        3: '0',
        4: ['male'],
      },
    });
  });

  it('should disable input when submission type is monitoring', async () => {
    const testForm = {
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
              disabled: {
                submission_type: ['monitoring'],
              },
            },
          ],
        },
      ],
    };

    useRoute.mockReturnValue({
      params: { submission_type: 'monitoring' },
    });

    const handleOnSubmit = jest.fn();
    const handleOnShowDialog = jest.fn();
    const { getByTestId, getByText } = render(
      <FormContainer
        forms={testForm}
        initialValues={{}}
        onSubmit={handleOnSubmit}
        setShowDialogMenu={handleOnShowDialog}
      />,
    );

    await waitFor(() => {
      expect(getByText('1. Your Name')).toBeDefined();
      const inputEl = getByTestId('type-input');
      expect(inputEl).toBeDefined();
      expect(inputEl.props.editable).toBeFalsy();
    });
  });
});
