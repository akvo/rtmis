import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { backgroundTask, notification } from '../../lib';
import Navigation, {
  setNotificationHandler,
  defineSyncFormVersionTask,
  defineSyncFormSubmissionTask,
} from '../index';
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

  it('should call set notification handler func', async () => {
    const mockHandleNotification = jest.fn().mockResolvedValue({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    });
    Notifications.setNotificationHandler.mockImplementation(({ handleNotification }) => {
      handleNotification(mockHandleNotification);
    });

    await setNotificationHandler();

    expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
  });

  it('should call define sync form version task func', async () => {
    TaskManager.defineTask.mockImplementation((taskName, taskFn) => taskFn());

    await defineSyncFormVersionTask();

    expect(TaskManager.defineTask).toHaveBeenCalledWith('sync-form-version', expect.any(Function));
    expect(backgroundTask.syncFormVersion).toHaveBeenCalledWith({
      sendPushNotification: notification.sendPushNotification,
      showNotificationOnly: true,
    });
  });

  it('should handle catch error when call define sync form version task func', async () => {
    TaskManager.defineTask.mockImplementation(async (taskName, taskFn) => {
      backgroundTask.syncFormVersion.mockRejectedValue(new Error('Simulated error'));

      const result = await taskFn();

      expect(TaskManager.defineTask).toHaveBeenCalledWith(
        'sync-form-version',
        expect.any(Function),
      );
      expect(result).toBe(BackgroundFetch.Result.Failed);
    });

    await defineSyncFormVersionTask();
  });

  it('should call define sync form submission task func', async () => {
    TaskManager.defineTask.mockImplementation((taskName, taskFn) => taskFn());

    await defineSyncFormSubmissionTask();

    expect(TaskManager.defineTask).toHaveBeenCalledWith(
      'sync-form-submission',
      expect.any(Function),
    );
    expect(backgroundTask.syncFormSubmission).toHaveBeenCalledTimes(1);
  });

  it('should handle catch error when call define sync form submission task func', async () => {
    TaskManager.defineTask.mockImplementation(async (taskName, taskFn) => {
      backgroundTask.syncFormSubmission.mockRejectedValue(new Error('Simulated error'));

      const result = await taskFn();

      expect(TaskManager.defineTask).toHaveBeenCalledWith(
        'sync-form-submission',
        expect.any(Function),
      );
      expect(result).toBe(BackgroundFetch.Result.Failed);
    });

    await defineSyncFormSubmissionTask();
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

  it('should call notification response received listener for sync form version', async () => {
    const mockAddNotificationResponseReceivedListener = jest.fn();
    const mockReceivedNotification = {
      notification: {
        request: {
          content: {
            title: 'Sync form version completed',
            body: 'A new version of the form is now available',
            data: {
              notificationType: 'sync-form-version',
            },
          },
          trigger: null,
        },
      },
    };
    Notifications.addNotificationResponseReceivedListener =
      mockAddNotificationResponseReceivedListener;
    backgroundTask.syncFormVersion.mockResolvedValue(() => jest.fn());

    const { unmount } = render(
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>,
    );

    const responseListenerCallback = mockAddNotificationResponseReceivedListener.mock.calls[0][0];
    responseListenerCallback(mockReceivedNotification);

    expect(backgroundTask.backgroundTaskStatus).toHaveBeenCalledWith('sync-form-version');
    expect(backgroundTask.backgroundTaskStatus).toHaveBeenCalledWith('sync-form-submission', 1);

    expect(notification.registerForPushNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledTimes(1);
    expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledTimes(1);
    expect(backgroundTask.syncFormVersion).toHaveBeenCalledWith({ showNotificationOnly: false });

    unmount();
  });

  it('should call notification response received listener for sync form submission', async () => {
    const mockAddNotificationResponseReceivedListener = jest.fn();
    const mockReceivedNotification = {
      notification: {
        request: {
          content: {
            title: 'Sync submission completed',
            body: 'Your submission has been successfully synchronized.',
            data: {
              notificationType: 'sync-form-submission',
            },
          },
          trigger: null,
        },
      },
    };
    Notifications.addNotificationResponseReceivedListener =
      mockAddNotificationResponseReceivedListener;
    backgroundTask.syncFormVersion.mockResolvedValue(() => jest.fn());

    const { unmount } = render(
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>,
    );

    const responseListenerCallback = mockAddNotificationResponseReceivedListener.mock.calls[0][0];
    responseListenerCallback(mockReceivedNotification);

    expect(backgroundTask.backgroundTaskStatus).toHaveBeenCalledWith('sync-form-version');
    expect(backgroundTask.backgroundTaskStatus).toHaveBeenCalledWith('sync-form-submission', 1);

    expect(notification.registerForPushNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledTimes(1);
    expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledTimes(1);
    expect(backgroundTask.syncFormVersion).not.toHaveBeenCalled();

    unmount();
  });
});
