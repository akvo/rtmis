/* eslint-disable prefer-promise-reject-errors */
import React from 'react';
import renderer from 'react-test-renderer';
import { render, fireEvent, act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthByPassFormPage from '../AuthByPassForm';
import api from '../../lib/api';
import cascades from '../../lib/cascades';
import { UIState, UserState } from '../../store';
import { crudUsers } from '../../database/crud';

jest.mock('../../lib/api');
jest.mock('../../database/crud');
jest.mock('../../lib/cascades');
// mock console error
global.console.error = jest.fn();

describe('AuthByPassForm', () => {
  test('it renders correctly', () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const tree = renderer.create(<AuthByPassFormPage navigation={navigation} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('it should have form id input and download button', () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;

    const wrapper = render(<AuthByPassFormPage navigation={navigation} />);

    const fidInput = wrapper.getByTestId('input-form-id');
    expect(fidInput).toBeDefined();
    const downloadButton = wrapper.getByTestId('button-download-form');
    expect(downloadButton).toBeDefined();
  });

  it('it should not download forms when offline', async () => {
    Platform.OS = 'android';
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    api.post.mockImplementation(() => Promise.resolve({ data: { formsUrl: [] } }));

    const wrapper = render(<AuthByPassFormPage navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = false;
      });
    });

    const fidInput = wrapper.getByTestId('input-form-id');
    const downloadButton = wrapper.getByTestId('button-download-form');

    fireEvent.changeText(fidInput, '1');
    fireEvent.press(downloadButton);

    expect(api.get).not.toHaveBeenCalled();
  });

  it('it should download forms when online', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    api.get.mockImplementation(() => Promise.resolve({ data: { id: 1, name: 'Test' } }));

    const wrapper = render(<AuthByPassFormPage navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const fidInput = wrapper.getByTestId('input-form-id');
    const downloadButton = wrapper.getByTestId('button-download-form');

    fireEvent.changeText(fidInput, '1');
    fireEvent.press(downloadButton);

    expect(api.get).toHaveBeenCalledWith('/forms/1');
  });

  it('it should navigate to add user if no user defined after form downloaded', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    // url: /forms/1
    const FormId1 = {
      id: 1,
      name: 'Household',
      version: '1.0.0',
      cascades: ['/cascades/1.sqlite'],
      question_group: [],
    };
    // url: /sqlite/file.sqlite
    const mockFile = 'file.sqlite';

    api.getConfig.mockImplementation(() => ({ baseURL: 'http://example.com' }));
    api.get.mockImplementation((url) => {
      if (url === '/forms/1') {
        Promise.resolve({ data: FormId1 });
      }
      if (url === '/cascades/1.sqlite') {
        Promise.resolve({ data: mockFile });
      }
    });

    const wrapper = render(<AuthByPassFormPage navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const fidInput = wrapper.getByTestId('input-form-id');
    const downloadButton = wrapper.getByTestId('button-download-form');

    fireEvent.changeText(fidInput, '1');
    fireEvent.press(downloadButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/forms/1');
      expect(cascades.download).toHaveBeenCalledWith(
        'http://example.com/cascades/1.sqlite',
        '/cascades/1.sqlite',
      );
    });
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('AddUser'));
  });

  it('it should navigate to home if user defined after form downloaded', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const mockGetData = {
      id: 1,
      name: 'Household',
      version: '1.0.0',
      cascades: ['/cascades/1.sqlite'],
      question_group: [],
    };
    const mockUser = { id: 1, name: 'John Doe', password: 'qwerty' };
    api.get.mockImplementation(() => Promise.resolve({ data: mockGetData }));
    crudUsers.getActiveUser.mockImplementation(() => Promise.resolve(mockUser));
    const { result: userStateRef } = renderHook(() => UserState.useState((s) => s));

    const wrapper = render(<AuthByPassFormPage navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const fidInput = wrapper.getByTestId('input-form-id');
    const downloadButton = wrapper.getByTestId('button-download-form');

    fireEvent.changeText(fidInput, '1');
    fireEvent.press(downloadButton);

    expect(api.get).toHaveBeenCalledWith('/forms/1');
    await waitFor(() => {
      const {
        id: userIdState,
        name: userNameState,
        password: userPasswordState,
      } = userStateRef.current;
      expect(userIdState).toEqual(mockUser.id);
      expect(userNameState).toEqual(mockUser.name);
      expect(userPasswordState).toEqual(mockUser.password);
      expect(navigation.navigate).toHaveBeenCalledWith('Home');
    });
  });

  it('it should be error 400', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    api.get.mockImplementation(() =>
      Promise.reject({ response: { message: 'Failed', status: 400 } }),
    );

    const wrapper = render(<AuthByPassFormPage navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const fidInput = wrapper.getByTestId('input-form-id');
    const downloadButton = wrapper.getByTestId('button-download-form');

    fireEvent.changeText(fidInput, '1');
    fireEvent.press(downloadButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/forms/1');
      const errorText = wrapper.getByTestId('fetch-error-text');
      expect(errorText).toBeTruthy();
    });
  });

  it('it should be error 500', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    api.get.mockImplementation(() =>
      Promise.reject({ response: { message: 'Failed', status: 500 } }),
    );

    const wrapper = render(<AuthByPassFormPage navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const fidInput = wrapper.getByTestId('input-form-id');
    const downloadButton = wrapper.getByTestId('button-download-form');

    fireEvent.changeText(fidInput, '1');
    fireEvent.press(downloadButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/forms/1');
    });
  });
});
