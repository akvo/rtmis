import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import TypeDate from '../TypeDate';

jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
}));

describe('TypeDate component', () => {
  it('should render the component correctly', () => {
    const initValues = { dateField: null };
    const { getByText, getByTestId, queryByTestId } = render(
      <Formik initialValues={initValues} onSubmit={() => {}}>
        {({ setFieldValue, values }) => (
          <TypeDate onChange={setFieldValue} value={values} id="dateField" name="Date Field" />
        )}
      </Formik>,
    );

    expect(getByText('1. Date Field')).toBeDefined();

    const dateField = getByTestId('type-date');
    expect(dateField).toBeDefined();

    const dateTimePicker = queryByTestId('date-time-picker');
    expect(dateTimePicker).toBeNull();
  });

  test('opens the date picker on input field press', () => {
    const initValues = { dateField: null };
    const { getByTestId } = render(
      <Formik initialValues={initValues} onSubmit={() => {}}>
        {({ setFieldValue, values }) => (
          <TypeDate
            onChange={setFieldValue}
            value={values[dateField]}
            id="dateField"
            name="Date Field"
          />
        )}
      </Formik>,
    );
    const dateField = getByTestId('type-date');
    fireEvent(dateField, 'pressIn');

    const dateTimePicker = getByTestId('date-time-picker');
    expect(dateTimePicker).toBeDefined();
  });

  test('calls the onChange function with the selected date', () => {
    const initValues = { dateField: null };
    const { getByTestId } = render(
      <Formik initialValues={initValues} onSubmit={() => {}}>
        {({ setFieldValue, values }) => (
          <TypeDate
            onChange={setFieldValue}
            value={values[dateField]}
            id="dateField"
            name="Date Field"
          />
        )}
      </Formik>,
    );

    const dateField = getByTestId('type-date');
    fireEvent(dateField, 'pressIn');

    const dateTimePicker = getByTestId('date-time-picker');
    fireEvent(dateTimePicker, 'change', { nativeEvent: { timestamp: 1624262400000 } });

    expect(dateField.props.value).toBe('2021-06-21');
  });

  test('should display correct initial value', () => {
    const initialValue = new Date(1624262400000);

    const initValues = { dateField: initialValue };
    const { getByTestId } = render(
      <Formik initialValues={initValues} onSubmit={() => {}}>
        {({ setFieldValue, values }) => (
          <TypeDate onChange={setFieldValue} value={values} id="dateField" name="Date Field" />
        )}
      </Formik>,
    );

    const dateField = getByTestId('type-date');
    expect(dateField.props.value).toBe('2021-06-21');
  });

  it('should not show required sign if required param is false and requiredSign is not defined', () => {
    const initValues = { dateField: null };
    const { queryByTestId } = render(
      <Formik initialValues={initValues} onSubmit={() => {}}>
        {({ setFieldValue, values }) => (
          <TypeDate
            onChange={setFieldValue}
            value={values}
            id="dateField"
            name="Date Field"
            required={false}
          />
        )}
      </Formik>,
    );

    const requiredIcon = queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should not show required sign if required param is false but requiredSign is defined', () => {
    const initValues = { dateField: null };
    const { queryByTestId } = render(
      <Formik initialValues={initValues} onSubmit={() => {}}>
        {({ setFieldValue, values }) => (
          <TypeDate
            onChange={setFieldValue}
            value={values}
            id="dateField"
            name="Date Field"
            required={false}
            requiredSign="*"
          />
        )}
      </Formik>,
    );

    const requiredIcon = queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should not show required sign if required param is true and requiredSign defined', () => {
    const initValues = { dateField: null };
    const { queryByTestId } = render(
      <Formik initialValues={initValues} onSubmit={() => {}}>
        {({ setFieldValue, values }) => (
          <TypeDate
            onChange={setFieldValue}
            value={values}
            id="dateField"
            name="Date Field"
            required={true}
            requiredSign="*"
          />
        )}
      </Formik>,
    );

    const requiredIcon = queryByTestId('field-required-icon');
    expect(requiredIcon).toBeTruthy();
  });

  it('should show required sign with custom requiredSign', () => {
    const initValues = { dateField: null };
    const { getByText } = render(
      <Formik initialValues={initValues} onSubmit={() => {}}>
        {({ setFieldValue, values }) => (
          <TypeDate
            onChange={setFieldValue}
            value={values}
            id="dateField"
            name="Date Field"
            required
            requiredSign="**"
          />
        )}
      </Formik>,
    );

    const requiredIcon = getByText('**');
    expect(requiredIcon).toBeTruthy();
  });

  it('should displays error message on validation', async () => {
    const validationSchema = Yup.object().shape({
      dateField: Yup.date().required('Date is required'),
    });

    const initValues = { dateField: null };
    const { getByTestId, getByText, debug } = render(
      <Formik
        initialValues={initValues}
        onSubmit={() => {}}
        validationSchema={validationSchema}
        validateOnChange
      >
        {({ setFieldValue, values }) => (
          <Form testID="mock-formik">
            <TypeDate
              onChange={setFieldValue}
              value={values}
              id="dateField"
              name="Date Field"
              required
              requiredSign="*"
            />
          </Form>
        )}
      </Formik>,
    );
    const formEl = getByTestId('mock-formik');
    fireEvent(formEl, 'onSubmit');
    await waitFor(() => {
      expect(getByText('Date is required')).toBeDefined();
    });
  });

  it('should accept string as initial value', () => {
    const initialValue = '2022-12-22';
    const initValues = { dateField: initialValue };
    const { getByTestId } = render(
      <Formik initialValues={initValues} onSubmit={() => {}}>
        {({ setFieldValue, values }) => (
          <TypeDate onChange={setFieldValue} value={values} id="dateField" name="Date Field" />
        )}
      </Formik>,
    );

    const dateField = getByTestId('type-date');
    expect(dateField.props.value).toBe('2022-12-22');
  });
});
