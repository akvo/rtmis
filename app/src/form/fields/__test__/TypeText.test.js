import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TypeText from '../TypeText';

describe('TypeText component', () => {
  test('renders correctly', () => {
    const onChangeMock = jest.fn();
    const values = {
      textValue: 'Initial value',
    };
    const id = 'textValue';
    const name = 'Text Field';

    const { getByText, getByTestId } = render(
      <TypeText onChange={onChangeMock} value={values.textValue} id={id} name={name} />,
    );

    const textAreaFieldLabel = getByText(`1. ${name}`);
    expect(textAreaFieldLabel).toBeDefined();

    const textAreaField = getByTestId('type-text');
    expect(textAreaField).toBeDefined();
    expect(textAreaField.props.value).toBe('Initial value');

    fireEvent.changeText(textAreaField, 'New value');
    expect(onChangeMock).toHaveBeenCalledTimes(1);
  });

  it('should not show required sign if required param is false and requiredSign is not defined', () => {
    const wrapper = render(<TypeText id="textValue" name="Text Field" required={false} />);
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should not show required sign if required param is false but requiredSign is defined', () => {
    const wrapper = render(
      <TypeText id="textValue" name="Text Field" required={false} requiredSign="*" />,
    );
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should not show required sign if required param is true and requiredSign defined', () => {
    const wrapper = render(
      <TypeText id="textValue" name="Text Field" required={true} requiredSign="*" />,
    );
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeTruthy();
  });

  it('should show required sign with custom requiredSign', () => {
    const wrapper = render(
      <TypeText id="textValue" name="Text Field" required={true} requiredSign="**" />,
    );
    const requiredIcon = wrapper.getByText('**');
    expect(requiredIcon).toBeTruthy();
  });
});
