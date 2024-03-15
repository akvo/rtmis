import React from 'react';
import renderer from 'react-test-renderer';
import { render, renderHook, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';

import AddUser from '../AddUser';
import { UserState } from '../../store';
import { conn } from '../../database';
import api from '../../lib/api';
import { crudForms, crudUsers } from '../../database/crud';

jest.mock('expo-sqlite');

jest.mock('expo-crypto');

jest.mock('../../lib/api');
jest.mock('../../database/crud');

const db = conn.init;

describe('AddUserPage', () => {
  test('renders correctly', () => {
    const tree = renderer.create(<AddUser />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test('only passcode is required', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const { getByText, getByTestId } = render(<AddUser navigation={navigation} />);
    const saveButton = getByTestId('button-save');
    expect(saveButton).toBeDefined();
    fireEvent.press(saveButton);

    await waitFor(() => {
      const errorText = getByText('Passcode is required');
      expect(errorText).toBeDefined();
    });
  });

  test('submit passcode correctly', async () => {
    /**
     * Mock existing users count: 1
     */
    const existingUserData = [
      {
        id: 1,
        name: 'User1',
        active: 1,
        token: 'tokenUser1',
      },
    ];
    /**
     * mock No passcode available
     */
    crudUsers.checkPasscode.mockImplementation(() => Promise.resolve({ rows: [{ length: 0 }] }));

    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const { getByTestId } = render(<AddUser navigation={navigation} />);
    const { result: userStateRef } = renderHook(() => UserState.useState((s) => s));

    const passcodeEl = getByTestId('input-name');
    expect(passcodeEl).toBeDefined();

    const passcodeVal = 's3crEt';
    fireEvent.changeText(passcodeEl, passcodeVal);

    const saveButton = getByTestId('button-save');
    expect(saveButton).toBeDefined();
    fireEvent.press(saveButton);

    const newUser = {
      id: 2,
      name: 'User2',
      active: 0,
      token: 'tokenUser2',
    };

    const mockResponse = {
      name: newUser.name,
      syncToken: newUser.token,
      formsUrl: [
        {
          id: 21,
          version: '1',
          url: '/form/21',
        },
      ],
    };

    api.post.mockImplementation(() => Promise.resolve({ data: mockResponse }));
    crudForms.addForm.mockImplementation(() =>
      Promise.resolve({ id: 21, userId: 2, formJSON: '{"form":"21", "question_group":[]}' }),
    );
    /**
     * Mock switch active user and insert new user
     */
    const allUsers = [...existingUserData, newUser].map((u) =>
      u.id === newUser.id ? { ...u, active: 1 } : { ...u, active: 0 },
    );
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: allUsers.length, _array: allUsers } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });

    act(() => {
      // switch current user with the new one
      UserState.update((s) => {
        s.id = newUser.id;
        s.name = newUser.name;
      });
    });

    const { name: currentUserName } = userStateRef.current;
    expect(currentUserName).toEqual('User2');

    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('Home', { newForms: true });
    });
  });

  it('should redirect to list users when click arrow back', () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const { getByTestId } = render(<AddUser navigation={navigation} />);

    const arrowBackEl = getByTestId('arrow-back-button');
    expect(arrowBackEl).toBeDefined();
    fireEvent.press(arrowBackEl);

    expect(navigation.navigate).toHaveBeenCalledWith('Users');
  });
});
