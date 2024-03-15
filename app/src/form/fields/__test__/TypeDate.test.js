import React from 'react';
import { render, fireEvent, act, renderHook } from '@testing-library/react-native';
import TypeDate from '../TypeDate';
import { FormState } from '../../../store';

jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
}));

describe('TypeDate component', () => {
  it('should render the component correctly', () => {
    const initValues = { 1: null };
    const mockOnChange = jest.fn();
    const { getByText, getByTestId, queryByTestId } = render(
      <TypeDate
        onChange={mockOnChange}
        value={initValues[1]}
        id="1"
        label="Date Field"
        keyform={0}
        required={false}
      />,
    );

    expect(getByText('1. Date Field')).toBeDefined();

    const dateField = getByTestId('type-date');
    expect(dateField).toBeDefined();

    const dateTimePicker = queryByTestId('date-time-picker');
    expect(dateTimePicker).toBeNull();
  });

  test('opens the date picker on input field press', () => {
    const initValues = { 1: null };
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <TypeDate
        onChange={mockOnChange}
        value={initValues[1]}
        id="1"
        label="Date Field"
        keyform={0}
        required={false}
      />,
    );
    const dateField = getByTestId('type-date');
    fireEvent(dateField, 'pressIn');

    const dateTimePicker = getByTestId('date-time-picker');
    expect(dateTimePicker).toBeDefined();
  });

  test('calls the onChange function with the selected date', () => {
    const initValues = { 1: null };
    const mockOnChange = jest.fn();
    const { getByTestId, rerender } = render(
      <TypeDate
        onChange={mockOnChange}
        value={initValues[1]}
        id="1"
        label="Date Field"
        keyform={0}
        required={false}
      />,
    );
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));

    const dateField = getByTestId('type-date');
    fireEvent(dateField, 'pressIn');

    const dateTimePicker = getByTestId('date-time-picker');
    fireEvent(dateTimePicker, 'change', { nativeEvent: { timestamp: 1624262400000 } });

    act(() => {
      FormState.update((s) => {
        s.currentValues = {
          1: '2021-06-21',
        };
      });
    });

    rerender(
      <TypeDate
        onChange={mockOnChange}
        value={result.current[1]}
        id="1"
        label="Date Field"
        keyform={0}
        required={false}
      />,
    );

    expect(dateField.props.value).toBe('2021-06-21');
  });

  test('should display correct initial value', () => {
    const initialValue = new Date(1624262400000);
    const initValues = { 1: initialValue };
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <TypeDate
        onChange={mockOnChange}
        value={initValues[1]}
        id="1"
        label="Date Field"
        keyform={0}
        required={false}
      />,
    );

    const dateField = getByTestId('type-date');
    expect(dateField.props.value).toBe('2021-06-21');
  });

  it('should not show required sign if required param is false and requiredSign is not defined', () => {
    const initValues = { 1: null };
    const mockOnChange = jest.fn();
    const { queryByTestId } = render(
      <TypeDate
        onChange={mockOnChange}
        value={initValues[1]}
        id="1"
        label="Date Field"
        keyform={0}
        required={false}
      />,
    );

    const requiredIcon = queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should not show required sign if required param is false but requiredSign is defined', () => {
    const initValues = { 1: null };
    const mockOnChange = jest.fn();
    const { queryByTestId } = render(
      <TypeDate
        onChange={mockOnChange}
        value={initValues[1]}
        id="1"
        label="Date Field"
        keyform={0}
        required={false}
      />,
    );

    const requiredIcon = queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should not show required sign if required param is true and requiredSign defined', () => {
    const initValues = { 1: null };
    const mockOnChange = jest.fn();
    const { queryByTestId } = render(
      <TypeDate
        onChange={mockOnChange}
        value={initValues[1]}
        id="1"
        label="Date Field"
        keyform={0}
        required
      />,
    );
    const requiredIcon = queryByTestId('field-required-icon');
    expect(requiredIcon).toBeTruthy();
  });

  it('should show required sign with custom requiredSign', () => {
    const initValues = { 1: null };
    const mockOnChange = jest.fn();
    const { getByText } = render(
      <TypeDate
        onChange={mockOnChange}
        value={initValues[1]}
        id="1"
        label="Date Field"
        keyform={0}
        required
        requiredSign="**"
      />,
    );

    const requiredIcon = getByText('**');
    expect(requiredIcon).toBeTruthy();
  });

  it('should accept string as initial value', () => {
    const initialValue = '2022-12-22';
    const initValues = { 1: initialValue };
    const mockOnChange = jest.fn();

    const { getByTestId } = render(
      <TypeDate
        onChange={mockOnChange}
        value={initValues[1]}
        id="1"
        label="Date Field"
        keyform={0}
        required={false}
      />,
    );

    const dateField = getByTestId('type-date');
    expect(dateField.props.value).toBe('2022-12-22');
  });
});
