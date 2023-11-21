import React from 'react';
import renderer from 'react-test-renderer';
import AuthFormPage from '../AuthForm';
import api from '../../lib/api';
import { UIState, UserState } from '../../store';
import { render, fireEvent, act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { crudUsers } from '../../database/crud';

jest.mock('../../lib/api');
jest.mock('../../database/crud');

describe('AuthFormPage', () => {
  test('renders correctly', () => {
    const tree = renderer.create(<AuthFormPage />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should not handle auth post when offline', async () => {
    Platform.OS = 'android';
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    api.post.mockImplementation(() => Promise.resolve({ data: { formsUrl: [] } }));

    const { getByTestId } = render(<AuthFormPage navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = false;
      });
    });

    const passcodeInput = getByTestId('auth-password-field');
    expect(passcodeInput).toBeDefined();
    const loginButton = getByTestId('auth-login-button');
    expect(loginButton).toBeDefined();

    fireEvent.changeText(passcodeInput, '123456');
    expect(loginButton.props.accessibilityState.disabled).toBe(false);

    fireEvent.press(loginButton);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('should show error message for wrong passcode', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    api.post.mockImplementation(() => Promise.reject({ response: { status: 401 } }));

    const { getByText, getByTestId } = render(<AuthFormPage navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });
    const passcodeInput = getByTestId('auth-password-field');
    const loginButton = getByTestId('auth-login-button');

    fireEvent.changeText(passcodeInput, '123456');
    fireEvent.press(loginButton);

    expect(api.post).toHaveBeenCalledWith('/auth', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await waitFor(() => expect(getByText('Invalid enumerator passcode')).toBeDefined());
  });

  it('should navigate to add user if no user defined after auth process', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const mockAuthPostData = {
      message: 'Success',
      formsUrl: [
        {
          id: 1,
          url: '/forms/1',
          version: '1.0.0',
        },
      ],
      syncToken: 'Bearer eyjtoken',
    };

    const mockFormResponse = {
      id: 1,
      name: 'Household',
      version: '1.0.0',
      cascades: ['/sqlite/file.sqlite'],
    };

    api.getConfig.mockImplementation(() => ({ baseURL: 'http://example.com' }));
    api.post.mockImplementation(() => Promise.resolve({ data: mockAuthPostData }));
    api.get.mockImplementation(() => Promise.resolve({ data: mockFormResponse }));

    const { getByTestId } = render(<AuthFormPage navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const passcodeInput = getByTestId('auth-password-field');
    const loginButton = getByTestId('auth-login-button');

    fireEvent.changeText(passcodeInput, '123456');
    fireEvent.press(loginButton);

    expect(api.post).toHaveBeenCalledWith('/auth', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('AddUser'));
  });

  it('should navigate to home if user defined after auth process', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const mockAuthPostData = {
      message: 'Success',
      formsUrl: [
        {
          id: 1,
          url: '/forms/1',
          version: '1.0.0',
        },
      ],
      syncToken: 'Bearer eyjtoken',
    };
    const mockUser = { id: 1, name: 'John Doe', password: 'qwerty' };
    api.post.mockImplementation(() => Promise.resolve({ data: mockAuthPostData }));
    crudUsers.getActiveUser.mockImplementation(() => Promise.resolve(mockUser));
    const { result: userStateRef } = renderHook(() => UserState.useState((s) => s));

    const { getByTestId } = render(<AuthFormPage navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const passcodeInput = getByTestId('auth-password-field');
    const loginButton = getByTestId('auth-login-button');

    fireEvent.changeText(passcodeInput, '123456');
    fireEvent.press(loginButton);

    expect(api.post).toHaveBeenCalledWith('/auth', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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

  it('it handle other network error', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    api.post.mockImplementation(() => Promise.reject({ response: { status: 500 } }));
    const { getByTestId } = render(<AuthFormPage navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const passcodeInput = getByTestId('auth-password-field');
    const loginButton = getByTestId('auth-login-button');

    fireEvent.changeText(passcodeInput, '123456');
    fireEvent.press(loginButton);

    expect(api.post).toHaveBeenCalledWith('/auth', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });
});
