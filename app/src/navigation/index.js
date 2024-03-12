import React, { useState, useEffect, useCallback } from 'react';
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
  AboutPage,
  UpdateForm,
} from '../pages';
import { UIState, AuthState, UserState, FormState, BuildParamsState } from '../store';
import { BackHandler } from 'react-native';
import * as Notifications from 'expo-notifications';
import { backgroundTask, notification } from '../lib';
import {
  SYNC_FORM_SUBMISSION_TASK_NAME,
  SYNC_FORM_VERSION_TASK_NAME,
} from '../lib/background-task';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const preventHardwareBackPressFormPages = ['Home', 'AddUser'];
  const currentPage = UIState.useState((s) => s.currentPage);
  const token = AuthState.useState((s) => s.token); // user already has session

  useEffect(() => {
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

  useEffect(() => {
    notification.registerForPushNotificationsAsync();
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      // console.info('[Notification]Received Listener');
    });
    const responseListener = Notifications.addNotificationResponseReceivedListener((res) => {
      const notificationBody = res?.notification?.request;
      const notificationType = notificationBody?.content?.data?.notificationType;
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

  useEffect(() => {
    backgroundTask.backgroundTaskStatus(SYNC_FORM_VERSION_TASK_NAME);
    backgroundTask.backgroundTaskStatus(SYNC_FORM_SUBMISSION_TASK_NAME);
  }, []);

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
          <Stack.Screen name="About" component={AboutPage} />
          <Stack.Screen name="SettingsForm" component={SettingsFormPage} />
          <Stack.Screen name="FormPage" component={FormPage} />
          <Stack.Screen name="UpdateForm" component={UpdateForm} />
          <Stack.Screen name="MapView" component={MapViewPage} />
          <Stack.Screen name="AddUser" component={AddUserPage} />
          <Stack.Screen name="Users" component={UsersPage} />
          <Stack.Screen name="FormDataDetails" component={FormDataDetailsPage} />
          <Stack.Screen name="AddNewForm" component={AddNewForm} />
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
