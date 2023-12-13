import React from 'react';
import { render, renderHook } from '@testing-library/react-native';
import QuestionField from '../QuestionField';
import { FormState } from '../../../store';
import { act } from 'react-test-renderer';

jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  useField: jest.fn().mockReturnValue([{}, {}, { setTouched: jest.fn() }]),
}));

describe('QuestionField component', () => {
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
});
