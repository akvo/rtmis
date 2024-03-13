import React from 'react';
import renderer from 'react-test-renderer';
import { render, fireEvent, act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthFormPage from '../AuthForm';
import api from '../../lib/api';
import { UIState, UserState } from '../../store';
import { crudUsers } from '../../database/crud';

jest.mock('../../lib/api');
jest.mock('../../database/crud');

describe('AuthFormPage', () => {
  test('renders correctly', () => {
    const tree = renderer.create(<AuthFormPage />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should not handle auth post when offline', async () => {
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
    await waitFor(() => expect(getByText('Fetching data')).toBeDefined());
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
    const mockUser = { id: 1, name: 'John Doe', token: 'Bearer eyjtoken' };
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
    api.getConfig.mockReturnValue({ baseURL: 'http://api.example.com' });
    api.get.mockImplementation(() =>
      Promise.resolve({
        data: {
          name: 'Form 1',
          version: 1,
          cascades: ['administrations.sqlite'],
          question_group: [],
        },
      }),
    );

    await waitFor(() => {
      const { id: userIdState, name: userNameState } = userStateRef.current;
      expect(userIdState).toEqual(mockUser.id);
      expect(userNameState).toEqual(mockUser.name);
      expect(navigation.navigate).toHaveBeenCalledWith('Home', { newForms: true });
    });
  });

  it('it handle other network error', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    api.post.mockImplementation(() =>
      Promise.reject({ response: { status: 500 }, message: 'Internal server error' }),
    );
    const { getByTestId, getByText } = render(<AuthFormPage navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const passcodeInput = getByTestId('auth-password-field');
    const loginButton = getByTestId('auth-login-button');

    fireEvent.changeText(passcodeInput, '123456');
    fireEvent.press(loginButton);

    await waitFor(() => {
      const errorMessage = getByTestId('auth-error-text');
      expect(errorMessage).toBeDefined();
      expect(getByText('500: Internal server error')).toBeDefined();
    });
  });
});
