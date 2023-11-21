import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Dialog, Text } from '@rneui/themed';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import axios from 'axios';

import { UserState } from '../store';
import { BaseLayout } from '../components';
import { crudDataPoints } from '../database/crud';
import { i18n, backgroundTask, api } from '../lib';
import { UIState, FormState } from '../store';
import { getCurrentTimestamp } from '../form/lib';

const convertMinutesToHHMM = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(remainingMinutes).padStart(2, '0');

  return `${formattedHours}h ${formattedMinutes}m`;
};

const syncButtonElement = ({
  showSubmitted,
  handleSyncButtonOnPress,
  disabled,
  syncSettings = true,
}) => {
  if (!showSubmitted || !syncSettings) {
    return {
      rightComponent: false,
    };
  }
  const iconName = disabled ? 'checkmark-done' : 'sync';
  const iconColor = disabled ? 'dodgerblue' : 'black';
  return {
    rightComponent: (
      <Button
        type="clear"
        disabled={disabled}
        onPress={handleSyncButtonOnPress}
        testID="button-to-trigger-sync"
      >
        <Icon name={iconName} color={iconColor} size={18} testID="icon-sync" />
      </Button>
    ),
  };
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
  const selectedForm = FormState.useState((s) => s.form);
  const questions = JSON.parse(selectedForm.json)?.question_group?.flatMap((qg) => qg.question);

  const syncSettings = (networkType === 'wifi' && syncWifiOnly) || !syncWifiOnly;

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
  }, [showSubmitted, activeUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    return data.filter(
      (d) => (search && d?.name?.toLowerCase().includes(search.toLowerCase())) || !search,
    );
  }, [data, search]);

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
    });
  };

  const enableSyncButton = useMemo(() => {
    return data.filter((d) => !d.syncedAt).length > 0;
  }, [data]);

  const handleSyncButtonOnPress = () => {
    setShowConfirmationSyncDialog(true);
  };

  const handleOnUploadPhotos = async () => {
    const data = await crudDataPoints.selectSubmissionToSync();
    const AllPhotos = data?.flatMap((d) => {
      const answers = JSON.parse(d.json);
      const photos = questions
        .filter((q) => q.type === 'photo')
        .map((q) => ({ id: q.id, value: answers?.[q.id], dataID: d.id }))
        .filter((p) => p.value);
      return photos;
    });

    if (AllPhotos?.length) {
      const uploads = AllPhotos.map((p) => {
        const fileType = p.value.split('.').slice(-1)[0];
        const formData = new FormData();
        formData.append('file', {
          uri: p.value,
          name: `photo_${p.id}_${p.dataID}.${fileType}`,
          type: `image/${fileType}`,
        });
        return api.post('/images', formData, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        });
      });

      axios
        .all(uploads)
        .then((responses) => {
          const updatedPhotos = responses
            .map(({ data: dataFile }) => {
              const findPhoto =
                AllPhotos.find((ap) => dataFile.file.includes(`${ap.id}_${ap.dataID}`)) || {};
              return {
                ...dataFile,
                ...findPhoto,
              };
            })
            .filter((d) => d);
          handleOnSync(updatedPhotos);
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      handleOnSync();
    }
  };

  const handleOnSync = (photos = []) => {
    setShowConfirmationSyncDialog(false);
    setData([]);
    setSyncing(true);
    backgroundTask
      .syncFormSubmission(photos)
      .then(async () => {
        await fetchData();
      })
      .catch((e) => {
        console.error('[Manual SyncFormSubmission]: ', e);
      })
      .finally(() => {
        UIState.update((s) => {
          s.isManualSynced = true;
        });
        setSyncing(false);
      });
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
      {...syncButtonElement({
        showSubmitted,
        handleSyncButtonOnPress,
        disabled: !enableSyncButton,
        syncSettings,
      })}
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
            onPress={handleOnUploadPhotos}
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
