import React, { useState } from 'react';
import { render, renderHook, fireEvent, act } from '@testing-library/react-native';
import DialogForm from '../DialogForm';

describe('DialogForm', () => {
  test('render slider correctly', () => {
    const mockOk = jest.fn();
    const mockCancel = jest.fn();
    const edit = {
      id: 23,
      type: 'slider',
      name: 'fontSize',
      label: 'Font size',
      description: null,
      key: 'UIState.fontSize',
      slider: {
        minimumValue: 12,
        maximumValue: 24,
        step: 4,
      },
    };
    const showDialog = true;
    const { getByTestId } = render(
      <DialogForm onOk={mockOk} onCancel={mockCancel} showDialog={showDialog} edit={edit} />,
    );
    const sliderEl = getByTestId('settings-form-slider');
    expect(sliderEl).toBeDefined();
  });

  test('render input correctly', () => {
    const mockOk = jest.fn();
    const mockCancel = jest.fn();
    const edit = {
      id: 11,
      type: 'text',
      label: 'Server URL',
      name: 'serverURL',
      description: null,
      key: 'BuildParamsState.serverURL',
    };
    const showDialog = true;
    const { getByTestId } = render(
      <DialogForm onOk={mockOk} onCancel={mockCancel} showDialog={showDialog} edit={edit} />,
    );
    const inputEl = getByTestId('settings-form-input');
    expect(inputEl).toBeDefined();
  });

  test('render select dropdown correctly', () => {
    const mockOk = jest.fn();
    const mockCancel = jest.fn();
    const edit = {
      id: 21,
      type: 'dropdown',
      name: 'lang',
      label: 'Language',
      description: 'Application language',
      key: 'UIState.lang',
      options: [
        {
          label: 'English',
          value: 'en',
        },
        {
          label: 'French',
          value: 'fr',
        },
      ],
    };
    const showDialog = true;
    // Step 1: Render the component containing the Dropdown
    const { getByTestId, rerender } = render(
      <DialogForm onOk={mockOk} onCancel={mockCancel} showDialog={showDialog} edit={edit} />,
    );
    const { result } = renderHook(() => useState(''));
    const [value, setValue] = result.current;

    // Step 2: Simulate user interaction with the dropdown
    const dropdown = getByTestId('settings-form-dropdown');
    const selectedLang = 'fr';

    fireEvent(dropdown, 'onChange', { value: selectedLang });

    act(() => {
      setValue(selectedLang);
    });

    rerender(
      <DialogForm
        onOk={mockOk}
        onCancel={mockCancel}
        showDialog={showDialog}
        edit={{
          ...edit,
          value: selectedLang,
        }}
      />,
    );

    // Step 3: Assert that the selected value is updated correctly
    // result.current[0];
    expect(value).toBe(selectedLang);

    const okButton = getByTestId('settings-form-dialog-ok');
    fireEvent.press(okButton);
    expect(mockOk).toHaveBeenCalled();
  });
});
