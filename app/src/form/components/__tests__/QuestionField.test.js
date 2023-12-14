import React from 'react';
import { render, renderHook } from '@testing-library/react-native';
import * as Formik from 'formik';
import QuestionField from '../QuestionField';
import { FormState } from '../../../store';
import { act } from 'react-test-renderer';

jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  useField: jest.fn().mockReturnValue([{}, {}, { setTouched: jest.fn() }]),
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

  test('prefilled question type text', async () => {
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

  test('question not showing when hidden is true', () => {
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
    expect(questionText).toBeNull();
    expect(inputElement).toBeNull();
  });

  test('question should be able pass the validation when hidden is true', () => {
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

    const { queryByTestId, queryByText } = render(
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

    const questionText = queryByText('Your Name', { exact: false });
    const inputElement = queryByTestId('type-input');
    const errorValidationEl = queryByTestId('err-validation-text');
    expect(questionText).toBeNull();
    expect(inputElement).toBeNull();
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
    expect(questionText).not.toBeNull();
    expect(inputElement).not.toBeNull();
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
});
