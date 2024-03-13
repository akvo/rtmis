import React from 'react';
import { render, fireEvent } from 'react-native-testing-library';
import TypeNumber from '../TypeNumber';

describe('TypeNumber component', () => {
  it('should render the component correctly', () => {
    const { getByTestId, getByText } = render(
      <TypeNumber onChange={() => jest.fn()} values={{}} id="inputField" label="Field Name" />,
    );

    const fieldLabel = getByTestId('field-label');
    expect(fieldLabel).toBeDefined();
    expect(getByText('1. Field Name')).toBeDefined();

    const inputElement = getByTestId('type-number');
    expect(inputElement).toBeDefined();
  });

  test('should call onChange when input number changes', () => {
    const onChangeMock = jest.fn();

    const { getByTestId } = render(
      <TypeNumber onChange={onChangeMock} values={{}} id="inputField" label="Field Name" />,
    );

    const inputElement = getByTestId('type-number');
    fireEvent.changeText(inputElement, 20);
    expect(onChangeMock).toHaveBeenCalledTimes(1);
  });

  test('should display correct initial value', () => {
    const initialValue = '20';

    const { getByTestId } = render(
      <TypeNumber onChange={() => {}} value={initialValue} id="inputField" label="Field Name" />,
    );

    const inputElement = getByTestId('type-number');
    expect(inputElement.props.value).toBe(initialValue);
  });

  it('should not show required sign if required param is false and requiredSign is not defined', () => {
    const wrapper = render(<TypeNumber id="inputField" label="Field Name" required={false} />);
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should not show required sign if required param is false but requiredSign is defined', () => {
    const wrapper = render(
      <TypeNumber id="inputField" label="Field Name" required={false} requiredSign="*" />,
    );
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should not show required sign if required param is true and requiredSign defined', () => {
    const wrapper = render(
      <TypeNumber id="inputField" label="Field Name" required requiredSign="*" />,
    );
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeTruthy();
  });

  it('should show required sign with custom requiredSign', () => {
    const wrapper = render(
      <TypeNumber id="inputField" label="Field Name" required requiredSign="**" />,
    );
    const requiredIcon = wrapper.getByText('**');
    expect(requiredIcon).toBeTruthy();
  });

  test.failing('should not show input preffix if addonBefore not defined', () => {
    const wrapper = render(<TypeNumber id="inputField" label="Field Label" />);

    const preffixElement = wrapper.getByTestId('field-preffix');
    expect(preffixElement).toBeDefined();
  });

  test('should show input preffix if addonBefore (string) defined', () => {
    const addonBefore = 'Addon Before';
    const wrapper = render(
      <TypeNumber id="inputField" label="Field Label" addonBefore={addonBefore} />,
    );

    const preffixElement = wrapper.getByTestId('field-preffix');
    expect(preffixElement).toBeDefined();
    expect(preffixElement.props.children).toEqual(addonBefore);
  });

  test('should show input preffix if addonBefore (React element) defined', () => {
    const addonBefore = <h1>React element</h1>;
    const wrapper = render(
      <TypeNumber id="inputField" label="Field Label" addonBefore={addonBefore} />,
    );

    const preffixElement = wrapper.getByTestId('field-preffix');
    expect(preffixElement).toBeDefined();
    expect(preffixElement.props.children).toEqual(addonBefore);
  });

  test.failing('should not show input suffix if only addonBefore defined', () => {
    const addonBefore = 'Addon Before';
    const wrapper = render(
      <TypeNumber id="inputField" label="Field Label" addonBefore={addonBefore} />,
    );

    const suffixElement = wrapper.getByTestId('field-suffix');
    expect(suffixElement).toBeDefined();
  });

  test.failing('should not show input preffix if addonBefore not defined', () => {
    const wrapper = render(<TypeNumber id="inputField" label="Field Label" />);

    const suffixElement = wrapper.getByTestId('field-suffix');
    expect(suffixElement).toBeDefined();
  });

  test('should show input suffix if addonAfter (string) defined', () => {
    const addonAfter = 'Addon After';
    const wrapper = render(
      <TypeNumber id="inputField" label="Field Label" addonAfter={addonAfter} />,
    );

    const suffixElement = wrapper.getByTestId('field-suffix');
    expect(suffixElement).toBeDefined();
    expect(suffixElement.props.children).toEqual(addonAfter);
  });

  test('should show input suffix if addonAfter (React element) defined', () => {
    const addonAfter = <h1>React element</h1>;
    const wrapper = render(
      <TypeNumber id="inputField" label="Field Label" addonAfter={addonAfter} />,
    );

    const suffixElement = wrapper.getByTestId('field-suffix');
    expect(suffixElement).toBeDefined();
    expect(suffixElement.props.children).toEqual(addonAfter);
  });

  test.failing('should not show input preffix if only addonAfter defined', () => {
    const addonAfter = 'Addon After';
    const wrapper = render(
      <TypeNumber id="inputField" label="Field Label" addonAfter={addonAfter} />,
    );

    const preffixElement = wrapper.getByTestId('field-preffix');
    expect(preffixElement).toBeDefined();
  });

  test.failing(
    'should not show both input suffix & preffix if both addonAfter & addonBefore not defined',
    () => {
      const wrapper = render(<TypeNumber id="inputField" label="Field Label" />);

      const preffixElement = wrapper.getByTestId('field-preffix');
      expect(preffixElement).toBeDefined();

      const suffixElement = wrapper.getByTestId('field-suffix');
      expect(suffixElement).toBeDefined();
    },
  );

  test('should show both input suffix & preffix if both addonAfter & addonBefore defined', () => {
    const addonBefore = 'Addon Before';
    const addonAfter = 'Addon After';
    const wrapper = render(
      <TypeNumber
        id="inputField"
        label="Field Label"
        addonBefore={addonBefore}
        addonAfter={addonAfter}
      />,
    );

    const preffixElement = wrapper.getByTestId('field-preffix');
    expect(preffixElement).toBeDefined();
    expect(preffixElement.props.children).toEqual(addonBefore);

    const suffixElement = wrapper.getByTestId('field-suffix');
    expect(suffixElement).toBeDefined();
    expect(suffixElement.props.children).toEqual(addonAfter);
  });
});
