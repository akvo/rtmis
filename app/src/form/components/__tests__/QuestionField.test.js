import React from 'react';
import { fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';
import * as Formik from 'formik';
import { View } from 'react-native';
import { act } from 'react-test-renderer';
import QuestionField from '../QuestionField';
import { FormState } from '../../../store';
import { generateValidationSchemaFieldLevel } from '../../lib';

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
    loadDataSource: jest.fn(async (source, id) =>
      id
        ? { rows: { length: 1, _array: [{ id: 42, name: 'Akvo', parent: 0 }] } }
        : {
            rows: {
              length: fakeData.length,
              _array: fakeData,
            },
          },
    ),
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
      name: 'full_name',
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
    };
    const { getByText, queryByText } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        onChange={setFieldValue}
        value={values[1]}
        validate={fakeValidate}
      />,
    );
    const questionText = queryByText('Your Name');
    expect(questionText).toBeDefined();
    const addOnText = getByText('Name');
    expect(addOnText).toBeDefined();
  });

  test('question not showing when hidden is true but it only styling', () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 1;
    const field = {
      id: 1,
      name: 'sanitation',
      label: 'Sanitation',
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
        onChange={setFieldValue}
        value={values[keyform]}
        validate={fakeValidate}
      />,
    );

    const questionText = queryByText('Sanitation', { exact: false });
    const inputElement = queryByTestId('type-input');
    const questionElement = queryByTestId('question-view', { includeHiddenElements: true });
    expect(questionText).toBeNull();
    expect(inputElement).toBeNull();
    expect(questionElement.props.style.display).toEqual('none');
  });

  test('question should be able pass the validation when hidden is true and doesnt have prefilled', () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 1;
    const field = {
      id: 1,
      name: 'full_name',
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
      pre: {},
      hidden: true,
    };
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const values = result.current;

    const { queryByTestId } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        onChange={setFieldValue}
        value={values[keyform]}
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
      label: 'Your Name',
      order: 1,
      type: 'input',
      required: true,
      meta: true,
      translations: [
        {
          label: 'Nama Anda',
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
        onChange={setFieldValue}
        value={values[keyform]}
        validate={fakeValidate}
      />,
    );

    const questionText = queryByText('Your Name', { exact: false });
    const inputElement = queryByTestId('type-input');
    const questionElement = queryByTestId('question-view');
    expect(questionText).not.toBeNull();
    expect(inputElement).not.toBeNull();
    expect(questionElement.props.style.display).toEqual('flex');
  });

  test('questions should be able to be validated when hidden is false', async () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 1;
    const field = {
      id: 1,
      label: 'Your Name',
      order: 1,
      type: 'input',
      required: true,
      meta: true,
      translations: [
        {
          label: 'Nama Anda',
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

    const { queryByTestId, getByText } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        onChange={setFieldValue}
        value={values[keyform]}
        validate={fakeValidate}
      />,
    );

    await act(async () => {
      const res = await generateValidationSchemaFieldLevel(result.current?.[keyform], field);
      FormState.update((s) => {
        s.feedback = res;
      });
    });

    await waitFor(() => {
      const questionText = getByText('1. Your Name');
      const inputElement = queryByTestId('type-input');
      const errorEl = queryByTestId('err-validation-text');
      expect(questionText).toBeDefined();
      expect(inputElement).not.toBeNull();
      expect(errorEl.children[0]).toEqual('Your Name is required.');
    });
  });

  test('questions should be displayed but not part of the payload when displayOnly is true', async () => {
    const setFieldValue = jest.fn();
    const fakeValidate = jest.fn();
    const keyform = 7;
    const field = {
      id: 7,
      label: 'Total Payment',
      order: 7,
      type: 'autofield',
      required: false,
      meta: false,
      translations: [
        {
          label: 'Total pembayaran',
          language: 'id',
        },
      ],
      displayOnly: true,
      fn: {
        fnString: '() => #5 * #6',
      },
    };
    const example = {
      id: 1,
      form: 'Test',
      question_group: [
        {
          id: 71,
          question: [field],
        },
      ],
    };
    act(() => {
      FormState.update((s) => {
        s.surveyStart = '2024-06-26-14.50.35.123';
        s.form = {
          json: JSON.stringify(example).replace(/'/g, "''"),
        };
      });
    });

    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const values = result.current;

    const { queryByTestId, queryByText, rerender } = render(
      <QuestionField
        keyform={keyform}
        field={field}
        onChange={setFieldValue}
        value={values[keyform]}
        validate={fakeValidate}
      />,
    );

    act(() => {
      FormState.update((s) => {
        s.currentValues = {
          5: 10000,
          6: 3,
        };
      });
    });

    rerender(
      <QuestionField
        keyform={keyform}
        field={field}
        onChange={setFieldValue}
        value={result.current[keyform]}
        validate={fakeValidate}
      />,
    );

    const questionText = queryByText('Total Payment', { exact: false });
    const inputElement = queryByTestId('type-autofield');
    expect(questionText).not.toBeNull();
    expect(inputElement).not.toBeNull();
    expect(inputElement.props.value).toBe('30000');

    act(() => {
      fireEvent(inputElement, 'onChange');
    });

    await waitFor(() => {
      const payload = result.current;
      expect(payload).toEqual({ 5: 10000, 6: 3 });
    });
  });
});
