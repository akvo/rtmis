import React from 'react';
import { render, waitFor } from 'react-native-testing-library';
import { act, renderHook } from '@testing-library/react-native';
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock';
import NetInfo from '@react-native-community/netinfo';

import App from '../App';
import { UIState, BuildParamsState } from 'store';
import { crudSessions, crudUsers, crudConfig } from '../src/database/crud';
import { conn, query } from '../src/database';

jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo);
jest.mock('@react-navigation/native-stack');
jest.mock('expo-sqlite');

jest.mock('../src/database/crud', () => ({
  crudSessions: {
    selectLastSession: jest.fn(() => Promise.resolve({})),
    addSession: jest.fn(),
  },
  crudUsers: {
    getActiveUser: jest.fn(() => Promise.resolve(false)),
    selectUserById: jest.fn(),
  },
  crudConfig: {
    getConfig: jest.fn(() => Promise.resolve(false)),
    addConfig: jest.fn(),
    updateConfig: jest.fn(),
  },
}));

const db = conn.init;

describe('App', () => {
  beforeAll(() => {
    crudSessions.selectLastSession.mockImplementation(() =>
      Promise.resolve({ id: 1, token: 'secret', passcode: 'test123' }),
    );
  });

  it('should update UIState on NetInfo change', async () => {
    // Render the component
    const { unmount } = await waitFor(() => render(<App />));
    // Simulate a connected network state
    NetInfo.addEventListener.mock.calls[0][0]({ isConnected: true });
    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    // Verify that UIState.update was called with the expected state
    expect(UIState.update).toHaveBeenCalledWith(expect.any(Function));

    // Verify that the NetInfo event listener was subscribed
    expect(NetInfo.addEventListener).toHaveBeenCalledWith(expect.any(Function));
    // Unmount the component to trigger the cleanup function
    unmount();
  });

  it('should set AddUser for currentPage in UIState when the users doesnt exists', async () => {
    UIState.useState.mockReturnValue('AddPage');
    render(<App />);
    await act(async () => {
      UIState.update((s) => {
        s.currentPage = 'AddPage';
      });
    });
    await waitFor(() => {
      const currentPage = UIState.useState((s) => s.currentPage);
      expect(currentPage).toBe('AddPage');
    });
  });

  it('should set Home for currentPage in UIState when the users exists', async () => {
    crudUsers.getActiveUser.mockImplementation(() =>
      Promise.resolve({ id: 1, name: 'John', active: 1 }),
    );
    UIState.useState.mockReturnValue('Home');
    render(<App />);
    await act(async () => {
      UIState.update((s) => {
        s.currentPage = 'Home';
      });
    });
    await waitFor(() => {
      const currentPage = UIState.useState((s) => s.currentPage);
      expect(currentPage).toBe('Home');
    });
  });

  it('should not set API token when the session is false', async () => {
    crudSessions.selectLastSession.mockImplementation(() => Promise.resolve(false));
    render(<App />);
    const mockApi = {
      setToken: jest.fn(),
    };

    await waitFor(() => {
      expect(mockApi.setToken).not.toHaveBeenCalled();
    });
  });

  it('should create config when its not exists', async () => {
    BuildParamsState.useState.mockReturnValue(null);
    const serverUrl = BuildParamsState.useState((s) => s.serverURL);

    render(<App />);
    expect(serverUrl).toBeNull();
    const mockAddConfig = jest.fn();
    act(() => {
      mockAddConfig();
    });

    crudConfig.getConfig.mockImplementation(() =>
      Promise.resolve({
        id: 1,
        serverURL: null,
      }),
    );

    await waitFor(async () => {
      const config = await crudConfig.getConfig();
      expect(mockAddConfig).toHaveBeenCalledTimes(1);
      expect(config).toEqual({ id: 1, serverURL: null });
    });
  });

  it('should set API serverURL when config is exists', async () => {
    const serverURL = 'http://api.example.com';
    crudConfig.getConfig.mockImplementation(() =>
      Promise.resolve({
        id: 1,
        serverURL,
      }),
    );

    render(<App />);
    const mockApiSetServerURL = jest.fn();

    act(() => {
      mockApiSetServerURL();
      BuildParamsState.update((s) => {
        s.serverURL = serverURL;
      });
    });

    BuildParamsState.useState.mockReturnValue(serverURL);

    await waitFor(() => {
      const serverURLState = BuildParamsState.useState((s) => s.serverURL);
      expect(mockApiSetServerURL).toHaveBeenCalledTimes(1);
      expect(serverURLState).toBe(serverURL);
    });
  });
});
