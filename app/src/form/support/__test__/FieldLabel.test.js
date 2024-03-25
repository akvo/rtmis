import React from 'react';
import { render } from '@testing-library/react-native';
import { UIState } from '../../../store';
import FieldLabel from '../FieldLabel';

describe('FieldLabel component', () => {
  beforeEach(() => {
    // Reset to default
    UIState.update((s) => {
      s.lang = 'en';
    });
  });

  it('renders label correctly', () => {
    const name = 'First Name';
    const { getByTestId } = render(<FieldLabel keyform={1} name={name} />);

    const labelElement = getByTestId('field-label');
    expect(labelElement.props.children[0]).toBe(`1. ${name}`);
  });

  it('should translate Question Text', () => {
    const frText = 'Numéro de téléphone';
    const { getByTestId } = render(<FieldLabel keyform={1} name={frText} />);

    const labelElement = getByTestId('field-label');
    expect(labelElement.props.children[0]).toBe(`1. ${frText}`);
  });

  it('should show question mark when tooltip is defined', () => {
    const tooltip = {
      text: 'First name and last name',
    };
    const questionText = 'First Name';
    const { getByTestId } = render(
      <FieldLabel keyform={1} name={questionText} tooltip={tooltip} />,
    );

    const labelElement = getByTestId('field-label');
    expect(labelElement.props.children[0]).toBe(`1. ${questionText}`);

    const tooltipIcon = getByTestId('field-tooltip-icon');
    expect(tooltipIcon).toBeDefined();
  });

  it('should not show required sign if requiredSign param is null', () => {
    const wrapper = render(<FieldLabel keyform={1} name="Question Name" />);
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should show required sign if requiredSign param is not null', () => {
    const wrapper = render(<FieldLabel keyform={1} name="Question Name" requiredSign="*" />);
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeTruthy();
  });

  it('should show custom required sign', () => {
    const wrapper = render(<FieldLabel keyform={1} name="Question Name" requiredSign="**" />);
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeTruthy();
    expect(requiredIcon.props.children).toEqual('**');
  });
});
