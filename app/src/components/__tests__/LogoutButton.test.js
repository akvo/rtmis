import React from 'react';
import { render, renderHook, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';

import LogoutButton from '../LogoutButton';
import { AuthState, UserState } from '../../store';
import { conn, query as dbQuery } from '../../database';
import { cascades, i18n } from '../../lib';

jest.mock('@react-navigation/native');
jest.mock('expo-sqlite');
jest.mock('../../lib', () => ({
  cascades: {
    dropFiles: jest.fn(async () => ['file.sqlite', 'file.sqlite-journal']),
  },
  i18n: {
    text: jest.fn(),
  },
  api: {
    setToken: jest.fn(),
  },
}));

const db = conn.init;

describe('LogoutButton', () => {
  beforeAll(() => {
    i18n.text.mockReturnValue({ buttonReset: 'Reset' });
  });

  test('render correctly', () => {
    const { getByText, getByTestId } = render(<LogoutButton />);

    const logoutItem = getByTestId('list-item-logout');
    expect(logoutItem).toBeDefined();

    const logoutText = getByText('Reset');
    expect(logoutText).toBeDefined();
  });

  test('state and session still exist when aborted logout', async () => {
    const mockToken = 'Bearer mockToken';
    const mockPasscode = 'secret123';
    act(() => {
      AuthState.update((s) => {
        s.token = mockToken;
      });
    });

    const sessionData = [
      {
        token: mockToken,
        passcode: mockPasscode,
      },
    ];
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: sessionData.length, _array: sessionData } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });

    const { getByTestId } = render(<LogoutButton />);
    const logoutEl = getByTestId('list-item-logout');
    fireEvent.press(logoutEl);

    const dialogEl = getByTestId('dialog-confirm-logout');
    expect(dialogEl).toBeDefined();
    const cancelEl = getByTestId('dialog-button-no');
    expect(cancelEl).toBeDefined();
    fireEvent.press(cancelEl);

    await waitFor(async () => {
      const { result } = renderHook(() => AuthState.useState());
      const { token } = result.current;
      const table = 'sessions';
      const selectQuery = dbQuery.read(table);
      const sessionRes = await conn.tx(db, selectQuery);
      expect(token).toEqual(mockToken);
      expect(sessionRes.rows).toHaveLength(sessionData.length);
      expect(sessionRes.rows._array).toEqual(sessionData);
    });
  });

  test('clear state and all tables on successfull logout', async () => {
    const mockToken = 'Bearer mockToken';

    act(() => {
      AuthState.update((s) => {
        s.token = mockToken;
      });
    });
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: 0, _array: [{ count: 0 }] } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });

    const { getByTestId } = render(<LogoutButton />);
    const logoutEl = getByTestId('list-item-logout');
    fireEvent.press(logoutEl);

    const dialogEl = getByTestId('dialog-confirm-logout');
    expect(dialogEl).toBeDefined();
    const yesEl = getByTestId('dialog-button-yes');
    expect(yesEl).toBeDefined();
    fireEvent.press(yesEl);

    await act(async () => {
      await cascades.dropFiles();
      AuthState.update((s) => {
        s.token = null;
      });
    });

    await waitFor(() => {
      const { result } = renderHook(() => AuthState.useState());
      const { token } = result.current;
      expect(token).toBe(null);

      const { result: userStateRef } = renderHook(() => UserState.useState());
      const { id, name, password } = userStateRef.current;
      expect(id).toBe(null);
      expect(name).toBe(null);
      expect(password).toBe('');

      const { result: navigationRef } = renderHook(() => useNavigation());
      const navigation = navigationRef.current;
      expect(navigation.navigate).toHaveBeenCalledWith('GetStarted');

      // Make sure all tables has rows count: 0
      const query = "SELECT name FROM sqlite_master WHERE type='table';";
      conn.tx(db, query).then(({ rows }) => {
        rows._array.forEach(({ name: tableName }) => {
          const q = `SELECT COUNT(*) AS count FROM ${tableName}`;
          conn.tx(db, q).then(({ rows: tableRows }) => {
            expect(tableRows._array[0].count).toBe(0);
          });
        });
      });
    });
  });
});
