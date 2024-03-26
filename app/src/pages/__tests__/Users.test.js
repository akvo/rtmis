/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { render, renderHook, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
// eslint-disable-next-line import/extensions
import mockBackHandler from 'react-native/Libraries/Utilities/__mocks__/BackHandler.js';

import Users from '../Users';
import { UserState, UIState } from '../../store';
import { conn, query } from '../../database';

jest.mock('expo-sqlite');

jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

jest.mock('react-native/Libraries/Utilities/BackHandler', () => mockBackHandler);

const db = conn.init;

describe('UsersPage', () => {
  beforeAll(() => {
    UIState.update((s) => {
      s.lang = 'en';
    });
  });
  beforeEach(() => {
    const usersData = [
      {
        id: 1,
        name: 'John',
        active: 1,
      },
    ];
    const mockSelectSql = jest.fn((_query, _params, successCallback) => {
      successCallback(null, { rows: { length: usersData.length, _array: usersData } });
    });

    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });
  });

  it('should match with snapshot', async () => {
    const mockNavigation = useNavigation();
    const { toJSON } = render(<Users navigation={mockNavigation} />);
    const { result } = renderHook(() => useState([]));
    const { result: resLoading } = renderHook(() => useState(true));
    const [users, setUsers] = result.current;
    const [loading, setLoading] = resLoading.current;

    await act(async () => {
      const selectQuery = query.read('users');
      const rows = await conn.tx(db, selectQuery);
      setUsers(rows._array);
      setLoading(false);
    });

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });

  it('should show empty page when users table has no data', () => {
    const mockNavigation = useNavigation();
    const mockSelectSql = jest.fn((_query, _params, successCallback) => {
      successCallback(null, { rows: { length: 0, _array: [] } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });

    const { queryByTestId } = render(<Users navigation={mockNavigation} />);

    const userItemEl = queryByTestId('list-item-user-1');
    expect(userItemEl).toBeNull();
  });

  it('should render users list when the table has data', async () => {
    const mockNavigation = useNavigation();
    const usersData = [
      {
        id: 1,
        name: 'John Doe',
        active: 1,
      },
      {
        id: 2,
        name: 'Miles Morales',
        active: 0,
      },
    ];
    const mockSelectSql = jest.fn((_query, _params, successCallback) => {
      successCallback(null, { rows: { length: usersData.length, _array: usersData } });
    });

    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });
    const { getByText } = render(<Users navigation={mockNavigation} />);
    const mockLoadUsers = jest.fn();
    act(() => {
      mockLoadUsers();
    });

    const { result } = renderHook(() => useState([]));
    const { result: resLoading } = renderHook(() => useState(true));
    const [users, setUsers] = result.current;
    const [loading, setLoading] = resLoading.current;

    await act(async () => {
      const selectQuery = query.read('users');
      const rows = await conn.tx(db, selectQuery);
      setUsers(rows._array);
      setLoading(false);
    });

    await waitFor(() => {
      expect(mockLoadUsers).toHaveBeenCalledTimes(1);
      expect(resLoading.current[0]).toBeFalsy();
      expect(getByText('John Doe')).toBeDefined();
      expect(getByText('Miles Morales')).toBeDefined();
    });
  });

  it('should show check mark for active user', async () => {
    const mockNavigation = useNavigation();
    const { getByTestId } = render(<Users navigation={mockNavigation} />);
    const { result } = renderHook(() => useState([]));
    const { result: resLoading } = renderHook(() => useState(true));
    const [users, setUsers] = result.current;
    const [loading, setLoading] = resLoading.current;

    await act(async () => {
      const selectQuery = query.read('users');
      const rows = await conn.tx(db, selectQuery);
      setUsers(rows._array);
      setLoading(false);
    });

    await waitFor(() => {
      const iconCheckMark = getByTestId('icon-checkmark-1');
      expect(iconCheckMark).toBeDefined();
    });
  });

  it('should be able to switch to another user', async () => {
    const mockNavigation = useNavigation();
    const usersData = [
      {
        id: 1,
        name: 'John Doe',
        active: 1,
      },
      {
        id: 2,
        name: 'Miles Morales',
        active: 0,
      },
    ];
    const mockSelectSql = jest.fn((_query, _params, successCallback) => {
      successCallback(null, { rows: { length: usersData.length, _array: usersData } });
    });

    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });

    const { getByTestId, rerender } = render(<Users navigation={mockNavigation} />);

    const { result } = renderHook(() => useState([]));
    const { result: resLoading } = renderHook(() => useState(true));
    const [users, setUsers] = result.current;
    const [loading, setLoading] = resLoading.current;

    await act(async () => {
      const selectQuery = query.read('users');
      const rows = await conn.tx(db, selectQuery);
      setUsers(rows._array);
      setLoading(false);
    });

    rerender(<Users navigation={mockNavigation} />);

    const selectedUser = getByTestId('list-item-user-2');

    expect(selectedUser).toBeDefined();
    fireEvent.press(selectedUser);

    const updatedUserData = [
      {
        id: 1,
        name: 'John Doe',
        active: 0,
      },
      {
        id: 2,
        name: 'Miles Morales',
        active: 1,
      },
    ];
    const mockUpdatedSql = jest.fn((_query, _params, successCallback) => {
      successCallback(null, { rows: { length: updatedUserData.length, _array: updatedUserData } });
    });

    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockUpdatedSql,
      });
    });

    act(() => {
      UserState.update((s) => {
        s.id = 2;
        s.name = 'Miles Morales';
      });
    });

    await waitFor(() => {
      const { result: res } = renderHook(() => UserState.useState((s) => s.name));
      const selectedUserChecked = getByTestId('icon-checkmark-2');
      expect(selectedUserChecked).toBeDefined();
      expect(res.current).toBe('Miles Morales');
    });
  });

  // it('should go to add user when plus icon clicked', () => {
  //   const mockNavigation = useNavigation();
  //   const { getByTestId, rerender } = render(<Users navigation={mockNavigation} />);
  //   const addUserButton = getByTestId('button-add-user');
  //   expect(addUserButton).toBeDefined();
  //   fireEvent.press(addUserButton);

  //   expect(mockNavigation.navigate).toHaveBeenCalledWith('AddUser');
  // });

  it('should redirect to Homepage when hardware back button pressed', async () => {
    const mockNavigation = useNavigation();
    render(<Users navigation={mockNavigation} />);

    act(() => {
      mockBackHandler.mockPressBack();
    });

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
    });
  });

  it('should reload page after new user added', async () => {
    const mockNavigation = useNavigation();
    const mockRoute = {
      params: {
        added: {
          id: 3,
          name: 'Barry Allen',
        },
      },
    };
    const { getByText } = render(<Users navigation={mockNavigation} route={mockRoute} />);

    const mockLoadUsers = jest.fn();
    act(() => {
      mockLoadUsers();
    });
    const updatedUserData = [
      {
        id: 1,
        name: 'John',
        active: 1,
      },
      {
        id: 3,
        name: 'Barry Allen',
        active: 0,
      },
    ];
    const mockUpdatedSql = jest.fn((_query, _params, successCallback) => {
      successCallback(null, { rows: { length: updatedUserData.length, _array: updatedUserData } });
    });

    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockUpdatedSql,
      });
    });
    act(() => {
      mockLoadUsers();
    });

    await waitFor(() => {
      expect(mockLoadUsers).toHaveBeenCalledTimes(2);
      expect(getByText('John')).toBeDefined();
      expect(getByText('Barry Allen')).toBeDefined();
    });
  });

  it('should be translated when UIState.lang changed', async () => {
    const mockNavigation = useNavigation();
    const { getByText } = render(<Users navigation={mockNavigation} />);

    const enTitle = getByText('Users');
    expect(enTitle).toBeDefined();

    act(() => {
      UIState.update((s) => {
        s.lang = 'fr';
      });
    });

    await waitFor(() => {
      const frTitle = getByText('Utilisateurs');
      expect(frTitle).toBeDefined();
    });
  });
});
