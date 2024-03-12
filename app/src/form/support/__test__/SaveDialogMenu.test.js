import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SaveDialogMenu from '../SaveDialogMenu';

describe('SaveDialogMenu component', () => {
  it('should not show dialog if visible prop false', () => {
    const wrapper = render(<SaveDialogMenu visible={false} setVisible={jest.fn()} />);

    const dialogElement = wrapper.queryByTestId('save-dialog-menu');
    expect(dialogElement).toBeTruthy();
    expect(dialogElement.props.visible).toEqual(false);
  });

  it('should show dialog if visible prop true', () => {
    const wrapper = render(<SaveDialogMenu visible={true} setVisible={jest.fn()} />);

    const dialogElement = wrapper.queryByTestId('save-dialog-menu');
    expect(dialogElement).toBeTruthy();
    expect(dialogElement.props.visible).toEqual(true);
  });

  it('should show Save and Exit button on dialog', () => {
    const wrapper = render(<SaveDialogMenu visible={true} setVisible={jest.fn()} />);

    const dialogElement = wrapper.queryByTestId('save-dialog-menu');
    expect(dialogElement).toBeTruthy();

    const saveAndExitButtonElement = wrapper.queryByTestId('save-and-exit-button');
    expect(saveAndExitButtonElement).toBeTruthy();
  });

  it('should show Exit without Saving button on dialog', () => {
    const wrapper = render(<SaveDialogMenu visible={true} setVisible={jest.fn()} />);

    const dialogElement = wrapper.queryByTestId('save-dialog-menu');
    expect(dialogElement).toBeTruthy();

    const exitWithoutSavingButtonElement = wrapper.queryByTestId('exit-without-saving-button');
    expect(exitWithoutSavingButtonElement).toBeTruthy();
  });

  it('should show Cancel button on dialog', () => {
    const wrapper = render(<SaveDialogMenu visible={true} setVisible={jest.fn()} />);

    const dialogElement = wrapper.queryByTestId('save-dialog-menu');
    expect(dialogElement).toBeTruthy();

    const cancelButtonElement = wrapper.queryByTestId('cancel-button');
    expect(cancelButtonElement).toBeTruthy();
  });

  it('should call handleOnSaveAndExit function onPress Save and Exit button', () => {
    const mockHandleOnSaveAndExit = jest.fn();

    const wrapper = render(
      <SaveDialogMenu
        visible={true}
        setVisible={jest.fn()}
        handleOnSaveAndExit={mockHandleOnSaveAndExit}
      />,
    );

    const dialogElement = wrapper.queryByTestId('save-dialog-menu');
    expect(dialogElement).toBeTruthy();

    const saveAndExitButtonElement = wrapper.queryByTestId('save-and-exit-button');
    expect(saveAndExitButtonElement).toBeTruthy();
    fireEvent.press(saveAndExitButtonElement);

    expect(mockHandleOnSaveAndExit).toBeCalledTimes(1);
  });

  it('should call handleOnExit function onPress Exit without Saving button', () => {
    const mockHandleExitWithoutSaving = jest.fn();

    const wrapper = render(
      <SaveDialogMenu
        visible={true}
        setVisible={jest.fn()}
        handleOnExit={mockHandleExitWithoutSaving}
      />,
    );

    const dialogElement = wrapper.queryByTestId('save-dialog-menu');
    expect(dialogElement).toBeTruthy();

    const exitWithoutSavingButtonElement = wrapper.queryByTestId('exit-without-saving-button');
    expect(exitWithoutSavingButtonElement).toBeTruthy();
    fireEvent.press(exitWithoutSavingButtonElement);

    expect(mockHandleExitWithoutSaving).toBeCalledTimes(1);
  });

  it('should hide dialog menu when Cancel button pressed', () => {
    const mockSetIsVisible = jest.fn();

    const wrapper = render(<SaveDialogMenu visible={true} setVisible={mockSetIsVisible} />);

    const dialogElement = wrapper.queryByTestId('save-dialog-menu');
    expect(dialogElement).toBeTruthy();

    const cancelButtonElement = wrapper.queryByTestId('cancel-button');
    expect(cancelButtonElement).toBeTruthy();
    fireEvent.press(cancelButtonElement);

    expect(mockSetIsVisible).toBeCalledWith(false);
  });
});
