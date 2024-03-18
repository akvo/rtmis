import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import notification from '../notification';

jest.mock('expo-notifications');
jest.mock('expo-device', () => ({
  ...jest.requireActual('expo-device'),
  isDevice: true,
}));

describe('notificationHandler', () => {
  describe('registerForPushNotificationsAsync', () => {
    it('should register for push notifications on Android', async () => {
      Platform.OS = 'android';
      const {
        setNotificationChannelAsync,
        getPermissionsAsync,
        requestPermissionsAsync,
        getExpoPushTokenAsync,
      } = Notifications;
      setNotificationChannelAsync.mockImplementation(() => Promise.resolve());
      getPermissionsAsync.mockImplementation(() => Promise.resolve({ status: 'granted' }));
      requestPermissionsAsync.mockImplementation(() => Promise.resolve({ status: 'granted' }));
      getExpoPushTokenAsync.mockImplementation(() => Promise.resolve({ data: 'mockedToken' }));

      await notification.registerForPushNotificationsAsync();

      expect(setNotificationChannelAsync).toHaveBeenCalledWith('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      expect(getPermissionsAsync).toHaveBeenCalled();
      expect(requestPermissionsAsync).not.toHaveBeenCalled();
      expect(getExpoPushTokenAsync).toHaveBeenCalled();
    });

    it('should log a warning if push notification permissions are not granted', async () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      Platform.OS = 'android';
      const { getPermissionsAsync, requestPermissionsAsync } = Notifications;
      getPermissionsAsync.mockImplementation(() => Promise.resolve({ status: 'denied' }));
      requestPermissionsAsync.mockImplementation(() => Promise.resolve({ status: 'denied' }));

      const token = await notification.registerForPushNotificationsAsync();

      expect(getPermissionsAsync).toHaveBeenCalled();
      expect(requestPermissionsAsync).toHaveBeenCalled();
      await waitFor(() => expect(consoleSpy).toHaveBeenCalledTimes(1));
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Notification]Failed to get push token for push notification!',
      );
      expect(token).toBeUndefined();
    });
  });

  describe('sendPushNotification', () => {
    it('should send a sync form version push notification if type not defined', async () => {
      const { scheduleNotificationAsync } = Notifications;
      scheduleNotificationAsync.mockResolvedValue();

      await notification.sendPushNotification();

      expect(scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'New Form version available',
          body: 'A new version of the form is now available',
          data: {
            notificationType: 'sync-form-version',
          },
        },
        trigger: null,
      });
    });

    it('should send a push notification by type defined', async () => {
      const { scheduleNotificationAsync } = Notifications;
      scheduleNotificationAsync.mockResolvedValue();

      await notification.sendPushNotification('sync-form-submission');

      expect(scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Sync submission completed',
          body: 'Your submission has been successfully synchronized.',
          data: {
            notificationType: 'sync-form-submission',
          },
        },
        trigger: null,
      });
    });
  });
});
