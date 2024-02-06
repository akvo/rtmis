import React, { useCallback, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

import Navigation from './src/navigation';
import { conn, query, tables } from './src/database';
import { UIState, AuthState, UserState, BuildParamsState } from './src/store';
import { crudUsers, crudConfig, crudDataPoints } from './src/database/crud';
import { api } from './src/lib';
import { NetworkStatusBar, SyncService } from './src/components';
import backgroundTask, {
  SYNC_FORM_SUBMISSION_TASK_NAME,
  SYNC_FORM_VERSION_TASK_NAME,
  defineSyncFormVersionTask,
} from './src/lib/background-task';
import crudJobs, { jobStatus, MAX_ATTEMPT } from './src/database/crud/crud-jobs';
import { ToastAndroid } from 'react-native';
import * as Location from 'expo-location';

export const setNotificationHandler = () =>
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

setNotificationHandler();
defineSyncFormVersionTask();

TaskManager.defineTask(SYNC_FORM_SUBMISSION_TASK_NAME, async () => {
  try {
    const pendingToSync = await crudDataPoints.selectSubmissionToSync();
    const activeJob = await crudJobs.getActiveJob(SYNC_FORM_SUBMISSION_TASK_NAME);
    console.info('[BACKGROUND ACTIVE JOB]', activeJob);

    if (activeJob?.status === jobStatus.ON_PROGRESS) {
      if (activeJob.attempt < MAX_ATTEMPT && pendingToSync.length) {
        /**
         * Job is still in progress,
         * but we still have pending items; then increase the attempt value.
         */
        await crudJobs.updateJob(activeJob.id, {
          attempt: activeJob.attempt + 1,
        });
      }

      if (activeJob.attempt === MAX_ATTEMPT) {
        /**
         * If the status is still IN PROGRESS and has reached the maximum attempts,
         * set it to PENDING when there are still pending sync items,
         * delete the job when it's finish and there are no pending items.
         */

        if (pendingToSync.length) {
          await crudJobs.updateJob(activeJob.id, {
            status: jobStatus.PENDING,
            attempt: 0, // RESET attempt to 0
          });
        } else {
          await crudJobs.deleteJob(activeJob.id);
        }
      }
    }

    if (
      activeJob?.status === jobStatus.PENDING ||
      (activeJob?.status === jobStatus.FAILED && activeJob?.attempt <= MAX_ATTEMPT)
    ) {
      await crudJobs.updateJob(activeJob.id, {
        status: jobStatus.ON_PROGRESS,
      });
      await backgroundTask.syncFormSubmission(activeJob);
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error(`[${SYNC_FORM_SUBMISSION_TASK_NAME}] Define task manager failed`, err);
    return BackgroundFetch.Result.Failed;
  }
});

const App = () => {
  const serverURLState = BuildParamsState.useState((s) => s.serverURL);
  const syncValue = BuildParamsState.useState((s) => s.dataSyncInterval);
  const gpsThreshold = BuildParamsState.useState((s) => s.gpsThreshold);
  const gpsAccuracyLevel = BuildParamsState.useState((s) => s.gpsAccuracyLevel);
  const geoLocationTimeout = BuildParamsState.useState((s) => s.geoLocationTimeout);
  const locationIsGranted = UserState.useState((s) => s.locationIsGranted);

  const handleCheckSession = () => {
    // check users exist
    crudUsers
      .getActiveUser()
      .then((user) => {
        console.info('Users =>', user);

        const page = 'Home';
        return { user, page };
      })
      .then(({ user, page }) => {
        api.setToken(user.token);
        UserState.update((s) => {
          s.id = user.id;
          s.name = user.name;
          s.password = user.password;
        });
        AuthState.update((s) => {
          s.token = user.token;
          s.authenticationCode = user.password;
        });
        UIState.update((s) => {
          s.currentPage = page;
        });
      });
  };

  const handleInitConfig = async () => {
    const configExist = await crudConfig.getConfig();
    const serverURL = configExist?.serverURL || serverURLState;
    const syncInterval = configExist?.syncInterval || syncValue;
    if (!configExist) {
      await crudConfig.addConfig({
        serverURL,
        syncInterval,
        gpsThreshold,
        gpsAccuracyLevel,
        geoLocationTimeout,
      });
    }
    if (serverURL) {
      BuildParamsState.update((s) => {
        s.serverURL = serverURL;
      });
      api.setServerURL(serverURL);
    }
    if (configExist) {
      /**
       * Update settings values from database
       */
      BuildParamsState.update((s) => {
        s.dataSyncInterval = configExist.syncInterval;
        s.gpsThreshold = configExist.gpsThreshold;
        s.gpsAccuracyLevel = configExist.gpsAccuracyLevel;
        s.geoLocationTimeout = configExist.geoLocationTimeout;
      });
    }
    console.info('[CONFIG] Server URL', serverURL);
  };

  const handleInitDB = useCallback(async () => {
    /**
     * Exclude the reset in the try-catch block
     * to prevent other queries from being skipped after this process.
     */
    await conn.reset();
    try {
      const db = conn.init;
      const queries = tables.map((t) => {
        const queryString = query.initialQuery(t.name, t.fields);
        return conn.tx(db, queryString);
      });
      await Promise.all(queries);
      await handleInitConfig();
      handleCheckSession();
    } catch (error) {
      ToastAndroid.show(`[INITIAL DB]: ${error}`, ToastAndroid.LONG);
    }
  }, [handleInitConfig, handleCheckSession]);

  useEffect(() => {
    handleInitDB();
  }, [handleInitDB]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      UIState.update((s) => {
        s.online = state.isConnected;
        s.networkType = state.type;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleOnRegisterTask = useCallback(async () => {
    try {
      const allTasks = await TaskManager.getRegisteredTasksAsync();
      console.log('allTasks', allTasks);
      allTasks.forEach(async (a) => {
        if ([SYNC_FORM_SUBMISSION_TASK_NAME, SYNC_FORM_VERSION_TASK_NAME].includes(a.taskName)) {
          console.info(`[${a.taskName}] IS REGISTERED`);
          await backgroundTask.registerBackgroundTask(a.taskName);
        }
      });
    } catch (error) {
      console.error('TASK REGISTER ERROR', error);
    }
  }, []);

  useEffect(() => {
    handleOnRegisterTask();
  }, [handleOnRegisterTask]);

  const requestAccessLocation = useCallback(async () => {
    if (locationIsGranted) {
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      UserState.update((s) => {
        s.locationIsGranted = true;
      });
    }
  }, [locationIsGranted]);

  useEffect(() => {
    requestAccessLocation();
  }, [requestAccessLocation]);

  return (
    <SafeAreaProvider>
      <Navigation testID="navigation-element" />
      <NetworkStatusBar />
      <SyncService />
    </SafeAreaProvider>
  );
};

export default App;
