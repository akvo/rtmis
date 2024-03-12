import React, { useState } from 'react';
import { View } from 'react-native';
import renderer from 'react-test-renderer';
import { render, renderHook, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';

import SettingsPage from '../Settings';
import { UIState, BuildParamsState } from '../../store';

jest.spyOn(View.prototype, 'measureInWindow').mockImplementation((cb) => {
  cb(18, 113, 357, 50);
});

describe('SettingsPage', () => {
  test('renders correctly', () => {
    const tree = renderer.create(<SettingsPage />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  {
    /* DISABLED: change language feature */
  }

  // it('should change language successfully', async () => {
  //   const { result: navigationRef } = renderHook(() => useNavigation());
  //   const navigation = navigationRef.current;
  //   const { getByTestId, getByText, queryByTestId, debug } = render(
  //     <SettingsPage navigation={navigation} />,
  //   );

  //   const { result: stateRef } = renderHook(() => useState(false));
  //   const [showLang, setShowLang] = stateRef.current;

  //   const settingsLangEl = getByTestId('settings-lang');
  //   expect(settingsLangEl).toBeDefined();
  //   fireEvent.press(settingsLangEl);

  //   act(() => {
  //     setShowLang(true);
  //   });

  //   const languageDialogElement = queryByTestId('settings-form-dialog');
  //   expect(languageDialogElement).toBeTruthy();
  //   expect(languageDialogElement.props.visible).toEqual(true);

  //   const languageDropdownElement = getByTestId('settings-form-dropdown');
  //   fireEvent.press(languageDropdownElement);

  //   const choosedLang = getByText('French');
  //   fireEvent.press(choosedLang);

  //   const okButton = getByTestId('settings-form-dialog-ok');
  //   fireEvent.press(okButton);

  //   act(() => {
  //     UIState.update((s) => {
  //       s.lang = 'fr';
  //     });
  //     setShowLang(false);
  //   });

  //   await waitFor(() => {
  //     const frTextEl = getByText('French');
  //     expect(frTextEl).toBeDefined();
  //   });
  // });

  // it('should close dialog when click cancel on language settings', () => {
  //   const { result: navigationRef } = renderHook(() => useNavigation());
  //   const navigation = navigationRef.current;
  //   const { getByTestId, getByText, queryByTestId } = render(
  //     <SettingsPage navigation={navigation} />,
  //   );

  //   const { result: stateRef } = renderHook(() => useState(false));
  //   const [showLang, setShowLang] = stateRef.current;

  //   const settingsLangEl = getByTestId('settings-lang');
  //   expect(settingsLangEl).toBeDefined();
  //   fireEvent.press(settingsLangEl);

  //   act(() => {
  //     setShowLang(true);
  //   });

  //   const languageDialogElement = queryByTestId('settings-form-dialog');
  //   expect(languageDialogElement).toBeTruthy();
  //   expect(languageDialogElement.props.visible).toEqual(true);

  //   const cancelButton = getByTestId('settings-form-dialog-cancel');
  //   fireEvent.press(cancelButton);

  //   expect(languageDialogElement.props.visible).toEqual(false);
  // });

  it('should go to settings form', () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const { getByTestId } = render(<SettingsPage navigation={navigation} />);

    const advancedItem = getByTestId('goto-settings-form-0');

    expect(advancedItem).toBeDefined();
    fireEvent.press(advancedItem);

    expect(navigation.navigate).toHaveBeenCalledWith('SettingsForm', { id: 1, name: 'Advanced' });
  });

  it('should not have add new form list if code_assignment set as auth type in build params', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;

    const { queryByTestId } = render(<SettingsPage navigation={navigation} />);

    act(() => {
      BuildParamsState.update((s) => {
        s.authenticationType = ['code_assignment', 'username', 'password'];
      });
    });

    await waitFor(() => {
      const addForm = queryByTestId('add-more-forms');
      expect(addForm).toBeFalsy();
    });
  });

  it('should have add new form list if code_assignment set as auth type in build params', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;

    const { getByTestId } = render(<SettingsPage navigation={navigation} />);

    act(() => {
      BuildParamsState.update((s) => {
        s.authenticationType = ['username', 'password'];
      });
    });

    const addForm = getByTestId('add-more-forms');
    expect(addForm).toBeTruthy();
    fireEvent.press(addForm);

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('AddNewForm', {});
    });
  });
});
