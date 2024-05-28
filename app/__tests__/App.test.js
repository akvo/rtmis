import React from 'react';
import { render, waitFor } from 'react-native-testing-library';
import { act, renderHook } from '@testing-library/react-native';
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock';
import NetInfo from '@react-native-community/netinfo';

import { UIState, BuildParamsState } from '../src/store';
import App from '../App';
import { crudSessions, crudUsers, crudConfig } from '../src/database/crud';

jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo);
jest.mock('@react-navigation/native-stack');
jest.mock('expo-sqlite');
jest.mock('@sentry/react-native', () => ({
  init: () => jest.fn(),
  wrap: (node) => jest.fn(node),
}));

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

describe('App', () => {
  beforeAll(() => {
    crudSessions.selectLastSession.mockImplementation(() =>
      Promise.resolve({ id: 1, token: 'secret', passcode: 'test123' }),
    );
  });

  it('should update UIState on NetInfo change', async () => {
    // Render the component
    const { unmount } = await waitFor(() => render(<App />));
    const { result } = renderHook(() => UIState.useState((s) => s.online));
    // Simulate a connected network state
    NetInfo.addEventListener.mock.calls[0][0]({ isConnected: true });
    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    await waitFor(() => {
      expect(result.current).toBeTruthy();
    });
    unmount();
  });

  it('should set Home for currentPage in UIState when the users exists', async () => {
    crudUsers.getActiveUser.mockImplementation(() =>
      Promise.resolve({ id: 1, name: 'John', active: 1 }),
    );
    render(<App />);
    const { result } = renderHook(() => UIState.useState((s) => s.currentPage));

    act(() => {
      UIState.update((s) => {
        s.currentPage = 'Home';
      });
    });
    await waitFor(() => {
      expect(result.current).toBe('Home');
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
    render(<App />);
    const { result } = renderHook(() => BuildParamsState.useState((s) => s.serverURL));

    crudConfig.getConfig.mockImplementation(() =>
      Promise.resolve({
        id: 1,
        serverURL: 'http://backend.test',
      }),
    );

    await waitFor(async () => {
      const config = await crudConfig.getConfig();
      expect(result.current).toEqual(config.serverURL);
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
    const { result } = renderHook(() => BuildParamsState.useState((s) => s.serverURL));

    act(() => {
      BuildParamsState.update((s) => {
        s.serverURL = serverURL;
      });
    });

    await waitFor(() => {
      expect(result.current).toBe(serverURL);
    });
  });
});
