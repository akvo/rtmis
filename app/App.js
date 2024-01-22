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

const db = conn.init;

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
         * set it to FINISH when there are no pending items.
         */

        if (pendingToSync.length) {
          await crudJobs.updateJob(activeJob.id, {
            status: jobStatus.PENDING,
          });
        } else {
          await crudJobs.updateJob(activeJob.id, {
            status: jobStatus.FINISH,
            active: 0,
            info: 'EMPTY DATA POINTS',
          });
        }
      }
    }

    if (
      activeJob?.status === jobStatus.PENDING ||
      (activeJob?.jobStatus === jobStatus.FAILED && activeJob?.attempt < MAX_ATTEMPT)
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
      await crudConfig.addConfig({ serverURL });
    }
    if (syncInterval) {
      BuildParamsState.update((s) => {
        s.dataSyncInterval = syncInterval;
      });
    }
    if (serverURL) {
      BuildParamsState.update((s) => {
        s.serverURL = serverURL;
      });
      api.setServerURL(serverURL);
      await crudConfig.updateConfig({ serverURL });
    }
    console.info('[CONFIG] Server URL', serverURL);
  };

  useEffect(() => {
    const queries = tables.map((t) => {
      const queryString = query.initialQuery(t.name, t.fields);
      return conn.tx(db, queryString);
    });
    Promise.all(queries)
      .then(() => {
        handleInitConfig();
      })
      .then(() => {
        handleCheckSession();
      });
  }, []);

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

  return (
    <SafeAreaProvider>
      <Navigation testID="navigation-element" />
      <NetworkStatusBar />
      <SyncService />
    </SafeAreaProvider>
  );
};

export default App;
