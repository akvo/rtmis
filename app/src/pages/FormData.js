import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Dialog, Text } from '@rneui/themed';
import { View, ActivityIndicator, StyleSheet, ToastAndroid } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import PropTypes from 'prop-types';
import * as Network from 'expo-network';
import { UserState, UIState, FormState } from '../store';
import { BaseLayout } from '../components';
import { crudDataPoints } from '../database/crud';
import { i18n, backgroundTask } from '../lib';
import { getCurrentTimestamp } from '../form/lib';
import crudJobs, { jobStatus } from '../database/crud/crud-jobs';

const convertMinutesToHHMM = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(remainingMinutes).padStart(2, '0');

  return `${formattedHours}h ${formattedMinutes}m`;
};

const SyncButton = ({ onPress, disabled = false }) => (
  <Button type="clear" disabled={disabled} onPress={onPress} testID="button-to-trigger-sync">
    <Icon
      name={disabled ? 'checkmark-done' : 'sync'}
      color={disabled ? 'dodgerblue' : 'black'}
      size={18}
      testID="icon-sync"
    />
  </Button>
);

SyncButton.propTypes = {
  onPress: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

const FormDataPage = ({ navigation, route }) => {
  const formId = route?.params?.id;
  const showSubmitted = route?.params?.showSubmitted || false;
  const { lang: activeLang, networkType } = UIState.useState((s) => s);
  const trans = i18n.text(activeLang);
  const { id: activeUserId, syncWifiOnly } = UserState.useState((s) => s);
  const [search, setSearch] = useState(null);
  const [data, setData] = useState([]);
  const [showConfirmationSyncDialog, setShowConfirmationSyncDialog] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const goBack = () => {
    navigation.navigate('ManageForm', { ...route?.params });
  };

  const fetchData = useCallback(async () => {
    const submitted = showSubmitted ? 1 : 0;
    let results = await crudDataPoints.selectDataPointsByFormAndSubmitted({
      form: formId,
      submitted,
      user: activeUserId,
    });
    results = results.map((res) => {
      const createdAt = moment(res.createdAt).format('DD/MM/YYYY hh:mm A');
      const syncedAt = res.syncedAt ? moment(res.syncedAt).format('DD/MM/YYYY hh:mm A') : '-';
      let subtitlesTemp = [
        `${trans.createdLabel}${createdAt}`,
        `${trans.surveyDurationLabel}${convertMinutesToHHMM(res.duration)}`,
      ];
      if (showSubmitted) {
        subtitlesTemp = [...subtitlesTemp, `${trans.syncLabel}${syncedAt}`];
      }
      return {
        ...res,
        subtitles: subtitlesTemp,
      };
    });
    setData(results);
  }, [
    showSubmitted,
    activeUserId,
    formId,
    trans.createdLabel,
    trans.surveyDurationLabel,
    trans.syncLabel,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(
    () =>
      data.filter(
        (d) => (search && d?.name?.toLowerCase().includes(search.toLowerCase())) || !search,
      ),
    [data, search],
  );

  const loadNetworkType = useCallback(async () => {
    const { type: networkTypeService } = await Network.getNetworkStateAsync();
    if (networkType !== networkTypeService) {
      UIState.update((s) => {
        s.networkType = networkTypeService;
      });
    }
  }, [networkType]);

  useEffect(() => {
    loadNetworkType();
  }, [loadNetworkType]);

  const goToDetails = (id) => {
    const findData = filteredData.find((d) => d.id === id);
    const { json: valuesJSON, name: dataPointName } = findData || {};

    FormState.update((s) => {
      const valuesParsed = JSON.parse(valuesJSON);
      s.currentValues = typeof valuesParsed === 'string' ? JSON.parse(valuesParsed) : valuesParsed;
    });

    navigation.navigate('FormDataDetails', { name: dataPointName });
  };

  const goToEditForm = (id) => {
    const selectedData = filteredData.find((d) => d.id === id);
    FormState.update((s) => {
      s.surveyStart = getCurrentTimestamp();
      s.surveyDuration = selectedData?.duration;
    });
    navigation.navigate('FormPage', {
      ...route?.params,
      dataPointId: id,
      newSubmission: false,
      submission_type: selectedData?.submission_type,
    });
  };

  const enableSyncButton = useMemo(() => data.filter((d) => !d.syncedAt).length > 0, [data]);

  const handleSyncButtonOnPress = () => {
    setShowConfirmationSyncDialog(true);
  };

  const runSyncSubmision = async () => {
    await backgroundTask.syncFormSubmission();
    await fetchData();
    UIState.update((s) => {
      s.isManualSynced = true;
    });
    setSyncing(false);
  };

  const handleOnSync = async () => {
    try {
      setShowConfirmationSyncDialog(false);
      setData([]);
      setSyncing(true);
      const activeJob = await crudJobs.getActiveJob();
      if (activeJob) {
        /**
         * Delete the active job while it is still in pending status to prevent duplicate submissions.
         */
        if (activeJob.status === jobStatus.PENDING) {
          await crudJobs.deleteJob(activeJob.id);
          await runSyncSubmision();
        } else {
          ToastAndroid.show(trans.autoSyncInProgress, ToastAndroid.LONG);
          setSyncing(false);
        }
      } else {
        await runSyncSubmision();
      }
    } catch (error) {
      setData(data);
      setSyncing(false);
      ToastAndroid.show(`${error?.errorCode}: ${error?.message}`, ToastAndroid.LONG);
    }
  };

  const handleOnAction = showSubmitted ? goToDetails : goToEditForm;

  return (
    <BaseLayout
      title={route?.params?.name}
      search={{
        show: true,
        placeholder: trans.formDataSearch,
        value: search,
        action: setSearch,
      }}
      leftComponent={
        <Button type="clear" onPress={goBack} testID="arrow-back-button">
          <Icon name="arrow-back" size={18} />
        </Button>
      }
      rightComponent={
        !showSubmitted ||
        (!filteredData.length && !search) ||
        (syncWifiOnly && networkType !== Network.NetworkStateType.WIFI) ? (
          false
        ) : (
          <SyncButton disabled={!enableSyncButton} onPress={handleSyncButtonOnPress} />
        )
      }
    >
      {syncing ? (
        <View style={styles.loadingContainer} testID="sync-loading">
          <ActivityIndicator />
        </View>
      ) : (
        <BaseLayout.Content data={filteredData} action={handleOnAction} testID="data-point-list" />
      )}

      {/* confirmation dialog to sync */}
      <Dialog visible={showConfirmationSyncDialog} testID="sync-confirmation-dialog">
        <Text testID="sync-confirmation-text">{trans.confirmSync}</Text>
        <Dialog.Actions>
          <Dialog.Button
            title={trans.buttonOk}
            onPress={handleOnSync}
            testID="sync-confirmation-ok"
          />
          <Dialog.Button
            title={trans.buttonCancel}
            onPress={() => setShowConfirmationSyncDialog(false)}
            testID="sync-confirmation-cancel"
          />
        </Dialog.Actions>
      </Dialog>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
});

export default FormDataPage;

FormDataPage.propTypes = {
  route: PropTypes.object,
};

FormDataPage.defaultProps = {
  route: null,
};
