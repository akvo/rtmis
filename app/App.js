import React, { useCallback, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import BackgroundService from 'react-native-background-actions';

import Navigation from './src/navigation';
import { conn, query, tables } from './src/database';
import { UIState, AuthState, UserState, BuildParamsState } from './src/store';
import { crudUsers, crudConfig } from './src/database/crud';
import { api } from './src/lib';
import { NetworkStatusBar, SyncService } from './src/components';
import backgroundTask, {
  SYNC_FORM_SUBMISSION_TASK_NAME,
  SYNC_FORM_VERSION_TASK_NAME,
  defineSyncFormSubmissionTask,
  defineSyncFormVersionTask,
} from './src/lib/background-task';

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
    await backgroundTask.syncFormSubmission();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error(`[${SYNC_FORM_SUBMISSION_TASK_NAME}] Define task manager failed`, err);
    return BackgroundFetch.Result.Failed;
  }
});

const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));

// You can do anything in your task such as network requests, timers and so on,
// as long as it doesn't touch UI. Once your task completes (i.e. the promise is resolved),
// React Native will go into "paused" mode (unless there are other tasks running,
// or there is a foreground app).
const veryIntensiveTask = async (taskDataArguments) => {
  // Example of an infinite loop task
  const { delay } = taskDataArguments;
  await new Promise(async (resolve) => {
    for (let i = 0; BackgroundService.isRunning(); i++) {
      console.log(i);
      await sleep(delay);
    }
  });
};

BackgroundService.on('expiration', (props) => {
  console.log('expiration', props);
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

      // const options = {
      //   taskName: SYNC_FORM_SUBMISSION_TASK_NAME,
      //   taskTitle: SYNC_FORM_SUBMISSION_TASK_NAME,
      //   taskDesc: 'Sync data submission',
      //   taskIcon: {
      //     name: 'ic_launcher',
      //     type: 'mipmap',
      //   },
      //   parameters: {
      //     delay: 3000,
      //   },
      // };

      // await BackgroundService.start(veryIntensiveTask, options);
      // await BackgroundService.start(backgroundTask.syncFormSubmission, options);
      // await BackgroundService.updateNotification({ taskDesc: 'Sync data submission' }); // Only Android, iOS will ignore this call
      // // iOS will also run everything here in the background until .stop() is called
      // await BackgroundService.stop();
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
      {/* <SyncService /> */}
    </SafeAreaProvider>
  );
};

export default App;
