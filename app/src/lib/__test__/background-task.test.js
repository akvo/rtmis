import * as BackgroundFetch from 'expo-background-fetch';
import * as Network from 'expo-network';
import { waitFor } from '@testing-library/react-native';
import api from '../api';
import backgroundTask from '../background-task';
import notification from '../notification';
import { crudForms, crudUsers, crudDataPoints } from '../../database/crud';
import { SUBMISSION_TYPES } from '../constants';

jest.mock('../api');
jest.mock('../../database/crud');
jest.mock('../notification');
jest.mock('expo-background-fetch');
jest.mock('expo-task-manager');
jest.mock('expo-network');

const entries = jest.fn();
const append = jest.fn();
global.FormData = () => ({ entries, append });

describe('backgroundTask', () => {
  const mockTaskName = 'taskName';
  const mockTaskOption = {
    minimumInterval: 3600,
    startOnBoot: true,
    stopOnTerminate: false,
  };

  describe('registerBackgroundTask', () => {
    it('should register a background task', async () => {
      await backgroundTask.registerBackgroundTask(mockTaskName);
      await waitFor(() =>
        expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalledWith(
          mockTaskName,
          mockTaskOption,
        ),
      );
    });
  });

  describe('unregisterBackgroundTask', () => {
    it('should unregister a background task', async () => {
      await backgroundTask.unregisterBackgroundTask(mockTaskName);
      expect(BackgroundFetch.unregisterTaskAsync).toHaveBeenCalledWith(mockTaskName);
    });
  });

  describe('syncFormSubmission', () => {
    const mockSession = { token: 'eyjtoken', passcode: '12345', name: 'John Doe' };
    const mockForm = {
      id: 123,
      formId: 456,
      name: 'Form Name',
      version: '1.0.0',
      latest: 1,
      json: JSON.stringify({
        formId: 456,
        name: 'Form Name',
        version: '1.0.0',
        question_group: [],
      }),
      createdAt: '2023-07-28T07:53:40.210Z',
    };
    const dataPoints = [
      {
        id: 1,
        formId: 456,
        user: 1,
        name: 'Data point 1 name',
        geo: '-8.676119|115.4927994',
        submitted: 1,
        duration: 2.5,
        createdAt: '2023-07-28T07:53:40.210Z',
        submittedAt: '2023-07-28T07:53:40.210Z',
        syncedAt: null,
        json: JSON.stringify({ 101: 'Data point 1', 102: 1, 103: 'file://photo_103_1.jpeg' }),
        json_form: JSON.stringify({
          id: 456,
          form: 'Test',
          question_group: [
            {
              id: 11,
              label: 'Group1',
              question: [
                { id: 101, type: 'input', label: 'Question #1' },
                { id: 102, type: 'number', label: 'Question #1' },
                { id: 103, type: 'photo', label: 'Question #1' },
              ],
            },
          ],
        }),
        submission_type: SUBMISSION_TYPES.registration,
      },
    ];
    beforeAll(() => {
      Network.getNetworkStateAsync.mockImplementation(() => Promise.resolve({ isConnected: true }));
    });

    it('should not sync submission and send push notification if data not available', async () => {
      const consoleSpy = jest.spyOn(console, 'error');
      // api.get.mockImplementation(() => Promise.resolve(true));
      crudUsers.getActiveUser.mockImplementation(() => Promise.resolve(mockSession));
      crudDataPoints.selectSubmissionToSync.mockImplementation(() => Promise.resolve([]));
      api.setToken.mockReturnValue({ token: mockSession.token });

      await backgroundTask.syncFormSubmission();
      expect(consoleSpy).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(crudUsers.getActiveUser).toHaveBeenCalled();
        expect(api.setToken).toHaveBeenCalled();
        expect(crudDataPoints.selectSubmissionToSync).toHaveBeenCalled();
        expect(crudForms.selectFormById).not.toHaveBeenCalled();
        expect(api.post).not.toHaveBeenCalled();
        expect(crudDataPoints.updateDataPoint).not.toHaveBeenCalled();
        expect(notification.sendPushNotification).not.toHaveBeenCalled();
      });
    });

    it('should not send push notification if sync to server failed', async () => {
      const consoleSpy = jest.spyOn(console, 'error');
      // api.get.mockImplementation(() => Promise.resolve(true));
      crudUsers.getActiveUser.mockImplementation(() => Promise.resolve(mockSession));
      crudDataPoints.selectSubmissionToSync.mockImplementation(() => Promise.resolve(dataPoints));
      crudForms.selectFormById.mockImplementation(() => Promise.resolve(mockForm));

      api.setToken.mockReturnValue({ token: mockSession.token });
      api.post.mockImplementation(() =>
        Promise.resolve({ status: 500, data: { message: 'Failed to sync' } }),
      );

      await backgroundTask.syncFormSubmission();
      expect(consoleSpy).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(crudUsers.getActiveUser).toHaveBeenCalled();
        expect(api.setToken).toHaveBeenCalled();
        expect(crudDataPoints.selectSubmissionToSync).toHaveBeenCalled();
        expect(api.post).toHaveBeenCalledWith('/sync', {
          answers: { 101: 'Data point 1', 102: 1, 103: 'file://photo_103_1.jpeg' },
          duration: 3,
          formId: 456,
          geo: [-8.676119, 115.4927994],
          name: 'Data point 1 name',
          submittedAt: '2023-07-28T07:53:40.210Z',
          submitter: 'John Doe',
          submission_type: SUBMISSION_TYPES.registration,
        });
        expect(crudDataPoints.updateDataPoint).not.toHaveBeenCalled();
        expect(notification.sendPushNotification).not.toHaveBeenCalledWith();
      });
    });

    it('should sync submission if any and send push notification', async () => {
      const consoleSpy = jest.spyOn(console, 'error');
      // api.get.mockImplementation(() => Promise.resolve(true));
      crudUsers.getActiveUser.mockImplementation(() => Promise.resolve(mockSession));
      crudDataPoints.selectSubmissionToSync.mockImplementation(() => Promise.resolve(dataPoints));
      crudForms.selectFormById.mockImplementation(() => Promise.resolve(mockForm));
      crudDataPoints.updateDataPoint.mockImplementation(() => Promise.resolve({ rowsAffected: 1 }));
      notification.sendPushNotification.mockImplementation(() =>
        Promise.resolve('sync-form-submission'),
      );

      api.setToken.mockReturnValue({ token: mockSession.token });
      api.post.mockImplementation(() =>
        Promise.resolve({ status: 200, data: { id: 123, message: 'Success' } }),
      );

      await backgroundTask.syncFormSubmission();
      expect(consoleSpy).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(crudUsers.getActiveUser).toHaveBeenCalled();
        expect(api.setToken).toHaveBeenCalled();
        expect(crudDataPoints.selectSubmissionToSync).toHaveBeenCalled();
        expect(api.post).toHaveBeenCalledWith('/sync', {
          answers: { 101: 'Data point 1', 102: 1, 103: 'file://photo_103_1.jpeg' },
          duration: 3,
          formId: 456,
          geo: [-8.676119, 115.4927994],
          name: 'Data point 1 name',
          submittedAt: '2023-07-28T07:53:40.210Z',
          submitter: 'John Doe',
          submission_type: SUBMISSION_TYPES.registration,
        });
        expect(crudDataPoints.updateDataPoint).toHaveBeenCalled();
        expect(notification.sendPushNotification).toHaveBeenCalledWith('sync-form-submission');
      });
    });
  });
});
