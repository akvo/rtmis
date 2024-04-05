import React from 'react';
import { render, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import Navigation from '../index';
import { AuthState, UIState } from '../../store';

jest.mock('expo-background-fetch', () => ({
  ...jest.requireActual('expo-background-fetch'),
  Result: {
    Failed: 'failed',
  },
  BackgroundFetchResult: {
    NewData: 'new-data',
  },
}));

jest.mock('expo-notifications');
jest.mock('expo-task-manager');
jest.mock('../../lib/background-task');
jest.mock('../../lib/notification');

describe('Navigation Component', () => {
  const mockAddEventListener = jest.fn((taskName, taskFn) => {
    taskFn();
  });
  const mockRemoveEventListener = jest.fn();

  BackHandler.addEventListener = mockAddEventListener.mockImplementation(() => ({
    remove: jest.fn(),
  }));
  BackHandler.removeEventListener = mockRemoveEventListener;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call set up hardware back press function listener and allow navigation if user not logged in', () => {
    const { unmount } = render(
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>,
    );

    act(() => {
      UIState.update((s) => {
        s.currentPage = 'GetStarted';
      });
      AuthState.update((s) => {
        s.token = null;
      });
    });

    expect(BackHandler.addEventListener).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function),
    );
    unmount();
  });

  it('should call set up hardware back press function listener and not allow navigation if user logged in', () => {
    const { unmount } = render(
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>,
    );

    act(() => {
      UIState.update((s) => {
        s.currentPage = 'GetStarted';
      });
      AuthState.update((s) => {
        s.token = 'eyj Token';
      });
    });

    expect(BackHandler.addEventListener).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function),
    );
    unmount();
  });
});
