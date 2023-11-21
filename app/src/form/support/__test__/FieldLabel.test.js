import React, { useState } from 'react';
import { render, renderHook, fireEvent, act } from '@testing-library/react-native';
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
    const { getByTestId } = render(<FieldLabel name={name} />);

    const labelElement = getByTestId('field-label');
    expect(labelElement.props.children).toBe(`1. ${name}`);
  });

  it('should translate Question Text', () => {
    const frText = 'Numéro de téléphone';
    const { getByTestId } = render(<FieldLabel name={frText} />);

    const labelElement = getByTestId('field-label');
    expect(labelElement.props.children).toBe(`1. ${frText}`);
  });

  it('should show question mark when tooltip is defined', () => {
    const tooltip = {
      text: 'First name and last name',
    };
    const questionText = 'First Name';
    const { getByTestId } = render(<FieldLabel name={questionText} tooltip={tooltip} />);

    const labelElement = getByTestId('field-label');
    expect(labelElement.props.children).toBe(`1. ${questionText}`);

    const tooltipIcon = getByTestId('field-tooltip-icon');
    expect(tooltipIcon).toBeDefined();
  });

  it('should show tooltip text when question mark clicked', () => {
    const tooltip = {
      text: 'First name and last name',
    };
    const questionText = 'First Name';
    const { getByTestId, queryByTestId, rerender, queryByText } = render(
      <FieldLabel name={questionText} tooltip={tooltip} />,
    );

    const labelElement = getByTestId('field-label');
    expect(labelElement.props.children).toBe(`1. ${questionText}`);

    const tooltipIcon = getByTestId('field-tooltip-icon');
    expect(tooltipIcon).toBeDefined();
    act(() => {
      fireEvent.press(tooltipIcon);
    });
    rerender(<FieldLabel name={questionText} tooltip={tooltip} />);

    const tooltipText = queryByTestId('field-tooltip-text');
    expect(tooltipText).toBeDefined();
    expect(tooltipText.props.children).toBe(tooltip.text);

    const toolTipContainer = getByTestId('tooltipPopoverContainer');
    expect(toolTipContainer).toBeDefined();
    act(() => {
      fireEvent.press(toolTipContainer);
    });
    rerender(<FieldLabel name={questionText} tooltip={tooltip} />);
    expect(queryByText(tooltip.text)).toBeNull();
  });

  it('should not show required sign if requiredSign param is null', () => {
    const wrapper = render(<FieldLabel keyform={0} name="Question Name" />);
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should show required sign if requiredSign param is not null', () => {
    const wrapper = render(<FieldLabel keyform={0} name="Question Name" requiredSign="*" />);
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeTruthy();
  });

  it('should show custom required sign', () => {
    const wrapper = render(<FieldLabel keyform={0} name="Question Name" requiredSign="**" />);
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeTruthy();
    expect(requiredIcon.props.children).toEqual('**');
  });
});
