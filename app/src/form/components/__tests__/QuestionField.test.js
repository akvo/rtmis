import React from 'react';
import { render, renderHook, waitFor } from '@testing-library/react-native';
import * as Formik from 'formik';
import { View } from 'react-native';
import QuestionField from '../QuestionField';
import { FormState } from '../../../store';
import { act } from 'react-test-renderer';
import { cascades } from '../../../lib';

jest.spyOn(View.prototype, 'measureInWindow').mockImplementation((cb) => {
  cb(18, 113, 357, 50);
});
jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  useField: jest.fn().mockReturnValue([{}, {}, { setTouched: jest.fn() }]),
}));

const fakeData = [
  { id: 41, name: 'Akvo', parent: 0 },
  { id: 42, name: 'Nuffic', parent: 0 },
];

jest.mock('expo-sqlite');
jest.mock('../../../lib', () => ({
  cascades: {
    loadDataSource: jest.fn(async (source, id) => {
      return id
        ? { rows: { length: 1, _array: [{ id: 42, name: 'Akvo', parent: 0 }] } }
        : {
            rows: {
              length: fakeData.length,
              _array: fakeData,
            },
          };
    }),
  },
  i18n: {
    text: jest.fn(() => ({
      searchPlaceholder: 'Search...',
    })),
  },
}));

describe('QuestionField component', () => {
  beforeEach(() => {
    FormState.update((s) => {
      s.currentValues = {};
    });
  });

  test('render question correctly', () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const values = { 1: '' };
    const keyform = 1;
    const field = {
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
    };
    const { getByText, queryByText } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={values}
        validate={fakeValidate}
      />,
    );
    const questionText = queryByText('Your Name');
    expect(questionText).toBeDefined();
    const addOnText = getByText('Name');
    expect(addOnText).toBeDefined();
  });

  test('prefilled question input type', async () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 1;
    const field = {
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
      pre: { answer: 'John Doe', fill: [{ id: 1, answer: 'John Doe' }] },
    };
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const values = result.current;

    const { getByTestId, rerender } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={values}
        validate={fakeValidate}
      />,
    );

    act(() => {
      FormState.update((s) => {
        s.currentValues = { 1: 'John Doe' };
      });
    });

    rerender(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={result.current}
        validate={fakeValidate}
      />,
    );

    const inputField = getByTestId('type-input');
    expect(inputField.props.value).toEqual('John Doe');
  });

  test('prefilled question text type', async () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 2;
    const field = {
      id: 2,
      name: 'Your Address',
      order: 2,
      type: 'text',
      required: true,
      meta: true,
      translations: [],
      pre: { answer: '101st Street', fill: [{ id: 2, answer: '101st Street' }] },
    };
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const values = result.current;

    const { getByTestId, rerender } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={values}
        validate={fakeValidate}
      />,
    );

    rerender(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={result.current}
        validate={fakeValidate}
      />,
    );

    const inputField = getByTestId('type-text');
    expect(inputField.props.value).toEqual('101st Street');
  });

  test('prefilled question option type', async () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 3;
    const field = {
      id: 3,
      name: 'Are you willing to participate in the survey?',
      order: 3,
      type: 'option',
      options: [
        {
          name: 'Yes',
        },
        {
          name: 'No',
        },
      ],
      required: true,
      meta: true,
      translations: [],
      pre: { answer: ['Yes'], fill: [{ id: 3, answer: ['Yes'] }] },
    };
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const values = result.current;

    const { getByTestId, queryByText, rerender } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={values}
        validate={fakeValidate}
      />,
    );

    act(() => {
      FormState.update((s) => {
        s.currentValues = { 3: ['Yes'] };
      });
    });

    rerender(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={result.current}
        validate={fakeValidate}
      />,
    );

    const inputField = getByTestId('type-option-dropdown');
    const questionText = queryByText('Are you willing to participate in the survey?', {
      exact: false,
    });
    const optionText = queryByText('Yes');
    expect(inputField).toBeDefined();
    expect(questionText).not.toBeNull();
    expect(optionText).toBeDefined();
  });

  test('prefilled question cascade type', async () => {
    cascades;
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 4;
    const field = {
      id: 4,
      name: 'Organisation',
      order: 4,
      type: 'cascade',
      required: true,
      api: {
        endpoint: '/api/v1/organisations?attributes=2',
      },
      meta: false,
      source: {
        file: 'organisation.sqlite',
        parent_id: [],
      },
      pre: {
        fill: [
          {
            id: 6030500021,
            answer: [41],
          },
        ],
        answer: [41],
      },
    };
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const values = result.current;

    const { getByTestId, queryByText, rerender, debug } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={values}
        validate={fakeValidate}
      />,
    );

    act(() => {
      FormState.update((s) => {
        s.currentValues = { 4: [41] };
      });
    });

    rerender(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={result.current}
        validate={fakeValidate}
      />,
    );

    await waitFor(() => {
      const questionText = queryByText('Organisation', { exact: false });
      const optionText = queryByText('Akvo');
      expect(questionText).not.toBeNull();
      expect(optionText).toBeDefined();
    });
  });

  test('question not showing when hidden is true but its defined', () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 1;
    const field = {
      id: 1,
      name: 'Sanitation',
      order: 1,
      type: 'input',
      required: true,
      meta: true,
      translations: [
        {
          name: 'Sanitasi',
          language: 'id',
        },
      ],
      pre: {
        answer: 'Basic',
        fill: [
          {
            id: 1,
            answer: 'Basic',
          },
        ],
      },
      hidden: true,
    };
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const values = result.current;

    const { queryByTestId, queryByText } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={values}
        validate={fakeValidate}
      />,
    );

    const questionText = queryByText('Sanitation', { exact: false });
    const inputElement = queryByTestId('type-input');
    const questionElement = queryByTestId('question-view');
    expect(questionText).not.toBeNull();
    expect(inputElement).not.toBeNull();
    expect(questionElement.props.style.opacity).toEqual(0);
  });

  test('question should be able pass the validation when hidden is true and doesnt have prefilled', () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 1;
    const field = {
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
      pre: {},
      hidden: true,
    };
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const values = result.current;

    const { queryByTestId } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={values}
        validate={fakeValidate}
      />,
    );

    jest
      .spyOn(Formik, 'useField')
      .mockReturnValue([
        {},
        { touched: true, error: 'Name is required' },
        { setTouched: jest.fn() },
      ]);

    const errorValidationEl = queryByTestId('err-validation-text');
    expect(errorValidationEl).toBeNull();
  });

  test('question should showing when hidden is false', () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 1;
    const field = {
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
      pre: {},
      hidden: false,
    };

    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const values = result.current;

    const { queryByTestId, queryByText } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={values}
        validate={fakeValidate}
      />,
    );

    const questionText = queryByText('Your Name', { exact: false });
    const inputElement = queryByTestId('type-input');
    const questionElement = queryByTestId('question-view');
    expect(questionText).not.toBeNull();
    expect(inputElement).not.toBeNull();
    expect(questionElement.props.style.opacity).toEqual(1);
  });

  test('questions should be able to be validated when hidden is false', () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 1;
    const field = {
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
      pre: {},
      hidden: false,
    };

    jest
      .spyOn(Formik, 'useField')
      .mockReturnValue([
        {},
        { touched: true, error: 'Name is required' },
        { setTouched: jest.fn() },
      ]);

    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const values = result.current;

    const { queryByTestId, queryByText } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={values}
        validate={fakeValidate}
      />,
    );

    const questionText = queryByText('Your Name', { exact: false });
    const inputElement = queryByTestId('type-input');
    const errorValidation = queryByText('Name is required');
    expect(questionText).not.toBeNull();
    expect(inputElement).not.toBeNull();
    expect(errorValidation).not.toBeNull();
  });

  test('questions should be able to be validated when hidden is true and have prefilled', async () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 1;
    const field = {
      id: 1,
      name: 'Sanitation',
      order: 1,
      type: 'input',
      required: true,
      meta: true,
      translations: [
        {
          name: 'Sanitasi',
          language: 'id',
        },
      ],
      pre: {
        answer: 'Basic',
        fill: [
          {
            id: 1,
            answer: 'Basic',
          },
        ],
      },
      hidden: true,
    };
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const values = result.current;

    const { queryByTestId, rerender, debug } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={values}
        validate={fakeValidate}
      />,
    );

    jest
      .spyOn(Formik, 'useField')
      .mockReturnValue([{}, { touched: true, error: null }, { setTouched: jest.fn() }]);

    rerender(
      <QuestionField
        keyform={keyform}
        field={field}
        setFieldValue={setFieldValue}
        values={result.current}
        validate={fakeValidate}
      />,
    );

    await waitFor(() => {
      const inputElement = queryByTestId('type-input');
      expect(inputElement.props.value).toEqual('Basic');
      const errorValidationEl = queryByTestId('err-validation-text');
      expect(Formik.useField).toHaveBeenCalled();
      expect(errorValidationEl).toBeNull();
    });
  });
});
