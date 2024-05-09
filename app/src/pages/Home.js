/* eslint-disable no-console */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, FAB } from '@rneui/themed';
import Icon from 'react-native-vector-icons/Ionicons';
import { Platform, ToastAndroid } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import PropTypes from 'prop-types';
import * as Network from 'expo-network';
import { BaseLayout } from '../components';
import {
  FormState,
  UserState,
  UIState,
  BuildParamsState,
  DatapointSyncState,
  AuthState,
} from '../store';
import { crudForms, crudUsers } from '../database/crud';
import { api, cascades, i18n } from '../lib';
import crudJobs, { SYNC_DATAPOINT_JOB_NAME, jobStatus } from '../database/crud/crud-jobs';

const Home = ({ navigation, route }) => {
  const params = route?.params || null;
  const [search, setSearch] = useState(null);
  const [data, setData] = useState([]);
  const [appLang, setAppLang] = useState('en');
  const [loading, setloading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncDisabled, setSyncDisabled] = useState(false);

  const locationIsGranted = UserState.useState((s) => s.locationIsGranted);
  const gpsAccuracyLevel = BuildParamsState.useState((s) => s.gpsAccuracyLevel);
  const gpsInterval = BuildParamsState.useState((s) => s.gpsInterval);
  const isManualSynced = UIState.useState((s) => s.isManualSynced);
  const userId = UserState.useState((s) => s.id);
  const passcode = AuthState.useState((s) => s.authenticationCode);
  const isOnline = UIState.useState((s) => s.online);
  const syncWifiOnly = UserState.useState((s) => s.syncWifiOnly);

  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  const { id: currentUserId, name: currentUserName } = UserState.useState((s) => s);
  const subTitleText = currentUserName ? `${trans.userLabel} ${currentUserName}` : null;

  const goToManageForm = (id) => {
    const findForm = data.find((d) => d?.id === id);
    FormState.update((s) => {
      s.form = findForm;
    });
    navigation.navigate('ManageForm', { id, name: findForm.name, formId: findForm.formId });
  };

  const goToUsers = () => {
    navigation.navigate('Users');
  };
  const syncAllForms = async (newForms = []) => {
    try {
      const endpoints = [...newForms, ...data].map((d) => api.get(`/form/${d.formId}`));
      const results = await Promise.allSettled(endpoints);
      const responses = results.filter(({ status }) => status === 'fulfilled');
      const cascadeFiles = responses.flatMap(({ value: res }) => res.data.cascades);
      const downloadFiles = [...new Set(cascadeFiles)];

      downloadFiles.forEach(async (file) => {
        await cascades.download(api.getConfig().baseURL + file, file, true);
      });

      responses.forEach(async ({ value: res }) => {
        const { data: apiData } = res;
        const { id: formId, version } = apiData;
        const findNew = newForms.find((n) => n.id === formId);
        if (findNew) {
          // insert new form to database
          await crudForms.addForm({
            ...findNew,
            userId,
            formJSON: apiData,
          });
        }
        await crudForms.updateForm({
          userId,
          formId,
          version,
          formJSON: apiData,
          latest: 1,
        });
      });

      UIState.update((s) => {
        /**
         * Refresh homepage to apply latest data
         */
        s.isManualSynced = true;
      });
    } catch (error) {
      Promise.reject(error);
    }
  };

  const syncUserForms = async () => {
    const { data: apiData } = await api.post('/auth', { code: passcode });
    api.setToken(apiData.syncToken);
    /**
     * Update certification assignment
     */
    UserState.update((s) => {
      s.certifications = apiData.certifications;
    });

    const myForms = await crudForms.getMyForms();

    if (myForms.length > apiData.formsUrl.length) {
      /**
       * Delete forms
       */
      await myForms
        .filter((mf) => !apiData.formsUrl.map((n) => n?.id).includes(mf.formId))
        .forEach(async (mf) => {
          await crudForms.deleteForm(mf.id);
        });
    }

    const newForms = apiData.formsUrl
      .filter((f) => !myForms?.map((mf) => mf.formId)?.includes(f.id))
      .map((f) => ({ ...f, formId: f.id }));

    await syncAllForms(newForms);
  };

  const handleOnSync = async () => {
    setSyncLoading(true);
    try {
      await syncUserForms();
      await crudUsers.updateLastSynced(userId);
      await crudJobs.addJob({
        user: userId,
        type: SYNC_DATAPOINT_JOB_NAME,
        status: jobStatus.PENDING,
      });
      DatapointSyncState.update((s) => {
        s.inProgress = true;
        s.added = true;
      });
      setSyncLoading(false);
    } catch (error) {
      ToastAndroid.show(`[ERROR SYNC DATAPOINT]: ${error}`, ToastAndroid.LONG);
      setSyncLoading(false);
    }
  };

  const getUserForms = useCallback(async () => {
    /**
     * The Form List will be refreshed when:
     * - parameter change
     * - current user id exists
     * - active language change
     * - manual synced change as True
     */
    if (params || currentUserId || activeLang !== appLang || isManualSynced) {
      if (activeLang !== appLang) {
        setAppLang(activeLang);
      }

      if (isManualSynced) {
        UIState.update((s) => {
          s.isManualSynced = false;
        });
      }
      try {
        const results = await crudForms.selectLatestFormVersion({ user: currentUserId });
        const forms = results
          .map((r) => ({
            ...r,
            subtitles: [
              `${trans.versionLabel}${r.version}`,
              `${trans.submittedLabel}${r.submitted}`,
              `${trans.draftLabel}${r.draft}`,
              `${trans.syncLabel}${r.synced}`,
            ],
          }))
          .filter((r) => r?.userId === currentUserId);
        setData(forms);
        setloading(false);
      } catch (error) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(`SQL: ${error}`, ToastAndroid.SHORT);
        }
      }
    }
  }, [
    params,
    currentUserId,
    activeLang,
    appLang,
    isManualSynced,
    trans.versionLabel,
    trans.submittedLabel,
    trans.draftLabel,
    trans.syncLabel,
  ]);

  useEffect(() => {
    getUserForms();
  }, [getUserForms]);

  useEffect(() => {
    if (loading) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(trans.downloadingData, ToastAndroid.SHORT);
      }
    }
  }, [loading, trans.downloadingData]);

  const filteredData = useMemo(
    () =>
      data.filter(
        (d) => (search && d?.name?.toLowerCase().includes(search.toLowerCase())) || !search,
      ),
    [data, search],
  );

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      getUserForms();
    });

    return () => subscription.remove();
  }, [getUserForms]);

  const watchCurrentPosition = useCallback(
    async (unsubscribe = false) => {
      if (!locationIsGranted) {
        return;
      }
      const timeInterval = gpsInterval * 1000; // miliseconds
      /**
       * Subscribe to the user's current location
       * @tutorial https://docs.expo.dev/versions/latest/sdk/location/#locationwatchpositionasyncoptions-callback
       */
      const watch = await Location.watchPositionAsync(
        {
          accuracy: gpsAccuracyLevel,
          timeInterval,
        },
        (res) => {
          console.info('[CURRENT LOC]', res?.coords);
          UserState.update((s) => {
            s.currentLocation = res;
          });
        },
      );

      if (unsubscribe) {
        watch.remove();
      }
    },
    [gpsAccuracyLevel, gpsInterval, locationIsGranted],
  );

  useEffect(() => {
    watchCurrentPosition();
    return () => {
      watchCurrentPosition(true);
    };
  }, [watchCurrentPosition]);

  useEffect(() => {
    const unsubsDataSync = DatapointSyncState.subscribe(
      (s) => s.inProgress,
      (inProgress) => {
        if (syncLoading && !inProgress) {
          setSyncLoading(false);
        }
      },
    );

    return () => {
      unsubsDataSync();
    };
  }, [syncLoading]);

  useEffect(() => {
    const unsubsNetwork = UIState.subscribe(
      (s) => s.networkType,
      (t) => {
        if (syncWifiOnly && (t !== Network.NetworkStateType.WIFI || t !== 'wifi')) {
          setSyncDisabled(true);
        }
      },
    );

    const unsubsWifi = UserState.subscribe(
      (s) => s.syncWifiOnly,
      (status) => {
        if (!status) {
          setSyncDisabled(false);
        }
      },
    );

    return () => {
      unsubsNetwork();
      unsubsWifi();
    };
  }, [syncWifiOnly]);

  return (
    <BaseLayout
      title={trans.homePageTitle}
      subTitle={subTitleText}
      search={{
        show: true,
        placeholder: trans.homeSearch,
        value: search,
        action: setSearch,
      }}
      leftComponent={
        <Button type="clear" testID="button-users" onPress={goToUsers}>
          <Icon name="person" size={18} />
        </Button>
      }
    >
      <BaseLayout.Content data={filteredData} action={goToManageForm} columns={2} />
      <FAB
        icon={{ name: 'sync', color: 'white' }}
        size="large"
        color="#1651b6"
        title={syncLoading ? trans.syncingText : trans.syncDataPointBtn}
        style={{ marginBottom: 16 }}
        disabled={!isOnline || syncLoading || syncDisabled}
        onPress={handleOnSync}
        testID="sync-datapoint-button"
      />
    </BaseLayout>
  );
};

export default Home;

Home.propTypes = {
  route: PropTypes.object,
};

Home.defaultProps = {
  route: null,
};
