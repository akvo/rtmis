import React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  HomePage,
  ManageFormPage,
  FormDataPage,
  GetStartedPage,
  AuthFormPage,
  AuthByPassFormPage,
  SettingsPage,
  SettingsFormPage,
  FormPage,
  AddUserPage,
  MapViewPage,
  UsersPage,
  FormDataDetailsPage,
  AddNewForm,
  ForSelection,
  AdministrationList,
} from '../pages';
import { UIState, AuthState, UserState, FormState, BuildParamsState } from '../store';
import { BackHandler } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { backgroundTask, notification } from '../lib';

const SYNC_FORM_VERSION_TASK_NAME = 'sync-form-version';
const SYNC_FORM_SUBMISSION_TASK_NAME = 'sync-form-submission';

export const setNotificationHandler = () =>
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
setNotificationHandler();

export const defineSyncFormVersionTask = () =>
  TaskManager.defineTask(SYNC_FORM_VERSION_TASK_NAME, async () => {
    try {
      await backgroundTask.syncFormVersion({
        sendPushNotification: notification.sendPushNotification,
        showNotificationOnly: true,
      });
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (err) {
      console.error(`[${SYNC_FORM_VERSION_TASK_NAME}] Define task manager failed`, err);
      return BackgroundFetch.Result.Failed;
    }
  });
defineSyncFormVersionTask();

export const defineSyncFormSubmissionTask = () =>
  TaskManager.defineTask(SYNC_FORM_SUBMISSION_TASK_NAME, async () => {
    try {
      await backgroundTask.syncFormSubmission();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (err) {
      console.error(`[${SYNC_FORM_SUBMISSION_TASK_NAME}] Define task manager failed`, err);
      return BackgroundFetch.Result.Failed;
    }
  });
defineSyncFormSubmissionTask();

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const preventHardwareBackPressFormPages = ['Home', 'AddUser'];
  const currentPage = UIState.useState((s) => s.currentPage);
  const token = AuthState.useState((s) => s.token); // user already has session
  const syncInterval = BuildParamsState.useState((s) => s.dataSyncInterval);

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!token || !preventHardwareBackPressFormPages.includes(currentPage)) {
        // Allow navigation if user is not logged in
        return false;
      }
      // Prevent navigation if user is logged in
      return true;
    });
    return () => backHandler.remove();
  }, [token, currentPage]);

  React.useEffect(() => {
    backgroundTask.backgroundTaskStatus(SYNC_FORM_VERSION_TASK_NAME);

    notification.registerForPushNotificationsAsync();
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      // console.info('[Notification]Received Listener');
    });
    const responseListener = Notifications.addNotificationResponseReceivedListener((res) => {
      const notificationBody = res?.notification?.request;
      const notificationType = notificationBody?.content?.data?.notificationType;
      // console.log('[Notification]Response Listener', notificationBody);
      if (notificationType === 'sync-form-version') {
        backgroundTask.syncFormVersion({ showNotificationOnly: false });
      }
      if (notificationType === 'sync-form-submission') {
        console.info('[Notification]Response Listener => ', notificationType);
      }
    });
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  React.useEffect(() => {
    backgroundTask.backgroundTaskStatus(SYNC_FORM_SUBMISSION_TASK_NAME, syncInterval);
  }, [syncInterval]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={currentPage}>
      {!token ? (
        <>
          <Stack.Screen name="GetStarted" component={GetStartedPage} />
          <Stack.Screen name="AuthForm" component={AuthFormPage} />
          <Stack.Screen name="AuthByPassForm" component={AuthByPassFormPage} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomePage} />
          <Stack.Screen name="ManageForm" component={ManageFormPage} />
          <Stack.Screen name="FormData" component={FormDataPage} />
          <Stack.Screen name="Settings" component={SettingsPage} />
          <Stack.Screen name="SettingsForm" component={SettingsFormPage} />
          <Stack.Screen name="FormPage" component={FormPage} />
          <Stack.Screen name="MapView" component={MapViewPage} />
          <Stack.Screen name="AddUser" component={AddUserPage} />
          <Stack.Screen name="Users" component={UsersPage} />
          <Stack.Screen name="FormDataDetails" component={FormDataDetailsPage} />
          <Stack.Screen name="AddNewForm" component={AddNewForm} />
          <Stack.Screen name="FormSelection" component={ForSelection} />
          <Stack.Screen name="AdministrationList" component={AdministrationList} />
        </>
      )}
    </Stack.Navigator>
  );
};

const Navigation = (props) => {
  const navigationRef = useNavigationContainerRef();

  const handleOnChangeNavigation = (state) => {
    // listen to route change
    const currentRoute = state.routes[state.routes.length - 1].name;
    if (['Home', 'ManageForm'].includes(currentRoute)) {
      // reset form values
      FormState.update((s) => {
        s.currentValues = {};
        s.questionGroupListCurrentValues = {};
        s.visitedQuestionGroup = [];
        s.surveyDuration = 0;
      });
    }
    UIState.update((s) => {
      s.currentPage = currentRoute;
    });
  };

  return (
    <NavigationContainer ref={navigationRef} onStateChange={handleOnChangeNavigation} {...props}>
      <RootNavigator />
    </NavigationContainer>
  );
};

export default Navigation;
