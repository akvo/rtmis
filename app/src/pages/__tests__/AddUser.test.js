import React from 'react';
import renderer from 'react-test-renderer';
import { render, renderHook, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';

import AddUser from '../AddUser';
import { UserState } from '../../store';
import { conn, query } from '../../database';

jest.mock('expo-sqlite');

jest.mock('expo-crypto');

db = conn.init;

describe('AddUserPage', () => {
  test('renders correctly', () => {
    const tree = renderer.create(<AddUser />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  test('only username is required', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const { getByText, getByTestId } = render(<AddUser navigation={navigation} />);
    const saveButton = getByTestId('button-save');
    expect(saveButton).toBeDefined();
    fireEvent.press(saveButton);

    await waitFor(() => {
      const errorText = getByText('Username is required');
      expect(errorText).toBeDefined();
    });
  });
  /*
  test('confirm password not matched', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const { getByText, getByTestId } = render(<AddUser navigation={navigation} />);

    const passwordEl = getByTestId('input-password');
    expect(passwordEl).toBeDefined();
    const confirmPassEl = getByTestId('input-confirm-password');
    expect(confirmPassEl).toBeDefined();

    const pass1 = 'secret';
    fireEvent.changeText(passwordEl, pass1);
    const pass2 = 'Hello';
    fireEvent.changeText(confirmPassEl, pass2);

    const saveButton = getByTestId('button-save');
    expect(saveButton).toBeDefined();
    fireEvent.press(saveButton);

    await waitFor(() => {
      const errorText = getByText('Passwords must match');
      expect(errorText).toBeDefined();
    });
  }); */

  test('create username correctly', async () => {
    /**
     * Mock users count: 0
     */
    const mockCountSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: 0, _array: [{ count: 0 }] } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockCountSql,
      });
    });

    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const { getByTestId } = render(<AddUser navigation={navigation} />);
    const { result: userStateRef } = renderHook(() => UserState.useState((s) => s));

    const usernameEl = getByTestId('input-name');
    expect(usernameEl).toBeDefined();

    const usernameVal = 'Jhon';
    fireEvent.changeText(usernameEl, usernameVal);

    const saveButton = getByTestId('button-save');
    expect(saveButton).toBeDefined();
    fireEvent.press(saveButton);

    act(() => {
      const insertQuery = query.insert('users', { id: 1, name: usernameVal, active: 1 });
      conn.tx(db, insertQuery);

      UserState.update((s) => {
        s.id = 1;
        s.name = usernameVal;
      });
    });

    await waitFor(() => {
      const { name: usernameState } = userStateRef.current;
      expect(usernameState).toEqual(usernameVal);
      expect(navigation.navigate).toHaveBeenCalledWith('Home');
    });

    const userData = [
      {
        id: 1,
        name: usernameVal,
        active: 1,
      },
    ];
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: userData.length, _array: userData } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });

    const selectQuery = query.read('users', { id: 1 });
    const resultSet = await conn.tx(db, selectQuery, [1]);
    expect(resultSet.rows).toHaveLength(userData.length);
    expect(resultSet.rows._array).toEqual(userData);
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

  it('should be able to validate username case insensitive', async () => {
    const userData = [
      {
        id: 1,
        name: 'jHon doe',
        active: 0,
      },
    ];
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: userData.length, _array: userData } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });

    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const { getByText, getByTestId } = render(<AddUser navigation={navigation} />);

    const name = 'Jhon Doe';
    const usernameEl = getByTestId('input-name');
    expect(usernameEl).toBeDefined();
    fireEvent.changeText(usernameEl, name);

    const saveButton = getByTestId('button-save');
    expect(saveButton).toBeDefined();
    fireEvent.press(saveButton);

    await waitFor(async () => {
      const checkQuery = query.read('users', { name }, true);
      const { rows } = await conn.tx(db, checkQuery, [name]);
      expect(rows.length).toBe(1);

      const errorText = getByText('User already exists');
      expect(errorText).toBeDefined();
    });
  });
});
