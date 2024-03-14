/* eslint-disable no-underscore-dangle */
import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';
import SaveDropdownMenu from '../SaveDropdownMenu';
import FormState from '../../../store/forms';

// According to the issue on @testing-library/react-native (for dropdown)
jest.spyOn(View.prototype, 'measureInWindow').mockImplementation((cb) => {
  cb(18, 113, 357, 50);
});

describe('SaveDropdownMenu component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not show dropdown menu if visible prop false', () => {
    const wrapper = render(<SaveDropdownMenu visible={false} setVisible={jest.fn()} />);

    const dropdownMenuElement = wrapper.queryByTestId('save-dropdown-menu');
    expect(dropdownMenuElement).toBeTruthy();
    expect(dropdownMenuElement.props.children[1]._owner.stateNode.props.visible).toEqual(false);
  });

  it('should show dropdown menu anchor and call setVisible function when pressed', () => {
    const mockSetVisible = jest.fn();

    const wrapper = render(<SaveDropdownMenu visible={false} setVisible={mockSetVisible} />);

    const anchorElement = wrapper.queryByTestId('anchor-dropdown-menu');
    expect(anchorElement).toBeTruthy();
    fireEvent.press(anchorElement);

    expect(mockSetVisible).toHaveBeenCalledTimes(1);
    expect(mockSetVisible).toHaveBeenCalledWith(true);
  });

  it('should show dropdown menu anchor from anchor prop and call setVisible function when pressed', () => {
    const mockSetVisible = jest.fn();
    const anchorButton = (
      <mock-Button testID="anchor-click" onPress={mockSetVisible}>
        Click
      </mock-Button>
    );

    const wrapper = render(
      <SaveDropdownMenu visible={false} setVisible={mockSetVisible} anchor={anchorButton} />,
    );

    const anchorElement = wrapper.queryByTestId('anchor-click');
    expect(anchorElement).toBeTruthy();
    fireEvent.press(anchorElement);

    expect(mockSetVisible).toHaveBeenCalledTimes(1);
  });

  it('should show dropdown menu if visible prop true', () => {
    const wrapper = render(<SaveDropdownMenu visible setVisible={jest.fn()} />);

    const dropdownMenuElement = wrapper.queryByTestId('save-dropdown-menu');
    expect(dropdownMenuElement).toBeTruthy();
    expect(dropdownMenuElement.props.children[1]._owner.stateNode.props.visible).toEqual(true);
  });

  it('should have Save and Exit button as dropdown menu item', async () => {
    const wrapper = render(<SaveDropdownMenu visible setVisible={jest.fn()} />);

    const dropdownMenuElement = wrapper.queryByTestId('save-dropdown-menu');
    expect(dropdownMenuElement).toBeTruthy();
    const menuItemElements =
      dropdownMenuElement.props.children[1].props.children.props.children.props.children.props
        .children.props.children;

    expect(menuItemElements[0].props.testID).toEqual('save-and-exit-menu-item');
    expect(menuItemElements[0].props.children).toEqual('Save and Exit');
  });

  it('should have Exit without Saving button as dropdown menu item', () => {
    const wrapper = render(<SaveDropdownMenu visible setVisible={jest.fn()} />);

    const dropdownMenuElement = wrapper.queryByTestId('save-dropdown-menu');
    expect(dropdownMenuElement).toBeTruthy();
    const menuItemElements =
      dropdownMenuElement.props.children[1].props.children.props.children.props.children.props
        .children.props.children;

    expect(menuItemElements[1].props.testID).toEqual('exit-without-saving-menu-item');
    expect(menuItemElements[1].props.children).toEqual('Exit without Saving');
  });

  it('should have Language Selection button as dropdown menu item', () => {
    const wrapper = render(<SaveDropdownMenu visible setVisible={jest.fn()} />);

    const dropdownMenuElement = wrapper.queryByTestId('save-dropdown-menu');
    expect(dropdownMenuElement).toBeTruthy();
    const menuItemElements =
      dropdownMenuElement.props.children[1].props.children.props.children.props.children.props
        .children.props.children;

    expect(menuItemElements[3].props.testID).toEqual('language-selection-menu-item');
    expect(menuItemElements[3].props.children).toEqual('Language Selection');
  });

  it('should call handleOnSaveAndExit function onPress Save and Exit button', () => {
    const mockHandleOnSaveAndExit = jest.fn();

    const wrapper = render(
      <SaveDropdownMenu
        visible
        setVisible={jest.fn()}
        handleOnSaveAndExit={mockHandleOnSaveAndExit}
      />,
    );

    const dropdownMenuElement = wrapper.queryByTestId('save-dropdown-menu');
    expect(dropdownMenuElement).toBeTruthy();
    const menuItemElements =
      dropdownMenuElement.props.children[1].props.children.props.children.props.children.props
        .children.props.children;

    act(() => menuItemElements[0].props.onPress());
    expect(mockHandleOnSaveAndExit).toHaveBeenCalledTimes(1);
  });

  it('should call handleOnExit function onPress Exit without Saving button', () => {
    const mockHandleOnExit = jest.fn();

    const wrapper = render(
      <SaveDropdownMenu visible setVisible={jest.fn()} handleOnExit={mockHandleOnExit} />,
    );

    const dropdownMenuElement = wrapper.queryByTestId('save-dropdown-menu');
    expect(dropdownMenuElement).toBeTruthy();
    const menuItemElements =
      dropdownMenuElement.props.children[1].props.children.props.children.props.children.props
        .children.props.children;

    act(() => menuItemElements[1].props.onPress());
    expect(mockHandleOnExit).toHaveBeenCalledTimes(1);
  });

  it('should show Language selection popup onPress Language Selection button', async () => {
    const wrapper = render(<SaveDropdownMenu visible setVisible={jest.fn()} />);

    const dropdownMenuElement = wrapper.queryByTestId('save-dropdown-menu');
    expect(dropdownMenuElement).toBeTruthy();
    const menuItemElements =
      dropdownMenuElement.props.children[1].props.children.props.children.props.children.props
        .children.props.children;

    expect(menuItemElements[3].props.testID).toEqual('language-selection-menu-item');
    expect(menuItemElements[3].props.children).toEqual('Language Selection');

    const languageDialogElement = wrapper.queryByTestId('settings-form-dialog');
    expect(languageDialogElement).toBeTruthy();
    expect(languageDialogElement.props.visible).toEqual(false);

    act(() => menuItemElements[3].props.onPress());

    await waitFor(() => {
      expect(languageDialogElement.props.visible).toEqual(true);
    });
  });

  it('should update activeLang when select a language on Language selection popup', async () => {
    FormState.update = jest.fn();

    const wrapper = render(<SaveDropdownMenu visible setVisible={jest.fn()} />);

    const dropdownMenuElement = wrapper.queryByTestId('save-dropdown-menu');
    expect(dropdownMenuElement).toBeTruthy();
    const menuItemElements =
      dropdownMenuElement.props.children[1].props.children.props.children.props.children.props
        .children.props.children;

    expect(menuItemElements[3].props.testID).toEqual('language-selection-menu-item');
    expect(menuItemElements[3].props.children).toEqual('Language Selection');

    const languageDialogElement = wrapper.queryByTestId('settings-form-dialog');
    expect(languageDialogElement).toBeTruthy();
    expect(languageDialogElement.props.visible).toEqual(false);

    act(() => menuItemElements[3].props.onPress());

    await waitFor(() => {
      expect(languageDialogElement.props.visible).toEqual(true);
    });

    const languageDropdownElement = wrapper.getByTestId('settings-form-dropdown');
    fireEvent.press(languageDropdownElement);

    const choosedLang = wrapper.getByTestId('English');
    await waitFor(() => {
      expect(choosedLang).toBeTruthy();
    });
    fireEvent.press(choosedLang);

    const okButtonElement = wrapper.getByTestId('settings-form-dialog-ok');
    fireEvent.press(okButtonElement);

    await waitFor(() => {
      expect(FormState.update).toHaveBeenCalled();
    });
  });
});
