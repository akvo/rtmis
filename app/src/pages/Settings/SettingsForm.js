import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { ListItem, Switch } from '@rneui/themed';
import * as Crypto from 'expo-crypto';
import * as Sentry from '@sentry/react-native';

import PropTypes from 'prop-types';
import { BaseLayout } from '../../components';
import { config } from './config';
import { BuildParamsState, UIState, AuthState, UserState } from '../../store';
import { conn, query } from '../../database';
import DialogForm from './DialogForm';
import { backgroundTask, i18n } from '../../lib';
import { accuracyLevels } from '../../lib/loc';

const db = conn.init;

const SettingsForm = ({ route }) => {
  const [edit, setEdit] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const { serverURL, dataSyncInterval, gpsThreshold, gpsAccuracyLevel, geoLocationTimeout } =
    BuildParamsState.useState((s) => s);
  const { password, authenticationCode, useAuthenticationCode } = AuthState.useState((s) => s);
  const { lang, isDarkMode, fontSize } = UIState.useState((s) => s);
  const { name, syncWifiOnly } = UserState.useState((s) => s);
  const store = useMemo(
    () => ({
      AuthState,
      BuildParamsState,
      UIState,
      UserState,
    }),
    [],
  );
  const [settingsState, setSettingsState] = useState({
    serverURL,
    name,
    password,
    authenticationCode,
    useAuthenticationCode,
    lang,
    isDarkMode,
    fontSize,
    dataSyncInterval,
    syncWifiOnly,
    gpsThreshold,
    gpsAccuracyLevel,
    geoLocationTimeout,
  });

  const nonEnglish = lang !== 'en';
  const curConfig = config.find((c) => c.id === route?.params?.id);
  const pageTitle = nonEnglish ? i18n.transform(lang, curConfig)?.name : route?.params.name;

  const editState = useMemo(() => {
    if (edit && edit?.key) {
      const [stateName, stateKey] = edit?.key?.split('.') || [];
      return [store[stateName], stateKey];
    }
    return null;
  }, [edit, store]);

  const handleEditPress = (id) => {
    const findEdit = list.find((item) => item.id === id);
    if (findEdit) {
      setEdit({
        ...findEdit,
        value: settingsState[findEdit?.name] || null,
      });
      setShowDialog(true);
    }
  };

  const handleUpdateOnDB = async (field, value) => {
    const configFields = [
      'apVersion',
      'authenticationCode',
      'serverURL',
      'syncInterval',
      'syncWifiOnly',
      'lang',
      'gpsThreshold',
      'gpsAccuracyLevel',
      'geoLocationTimeout',
    ];
    const id = 1;
    if (configFields.includes(field)) {
      const updateQuery = query.update('config', { id }, { [field]: value });
      await conn.tx(db, updateQuery, [id]);
    }
    if (field === 'name') {
      const updateQuery = query.update('users', { id }, { name: value });
      await conn.tx(db, updateQuery, [id]);
    }
    if (field === 'password') {
      const encrypted = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, value);
      const updateQuery = query.update('users', { id }, { password: encrypted });
      await conn.tx(db, updateQuery, [id]);
    }
  };

  const handleOnRestarTask = async (v) => {
    try {
      await backgroundTask.unregisterBackgroundTask('sync-form-submission');
      await backgroundTask.registerBackgroundTask('sync-form-submission', parseInt(v, 10));
    } catch (error) {
      Sentry.captureMessage('[SettingsForm] handleOnRestarTask failed');
      Sentry.captureException(error);
      Promise.reject(error);
    }
  };

  const handleOKPress = async (inputValue) => {
    setShowDialog(false);
    if (edit && inputValue) {
      const [stateData, stateKey] = editState;
      stateData.update((d) => {
        d[stateKey] = inputValue;
      });
      setSettingsState({
        ...settingsState,
        [stateKey]: inputValue,
      });
      if (stateKey === 'dataSyncInterval') {
        await handleUpdateOnDB('syncInterval', inputValue);
        await handleOnRestarTask(inputValue);
      } else {
        await handleUpdateOnDB(stateKey, inputValue);
      }
      setEdit(null);
    }
  };
  const handleCancelPress = () => {
    setShowDialog(false);
    setEdit(null);
  };

  const handleOnSwitch = (value, key) => {
    const [stateName, stateKey] = key.split('.');
    const tinyIntVal = value ? 1 : 0;
    store[stateName].update((s) => {
      s[stateKey] = tinyIntVal;
    });
    setSettingsState({
      ...settingsState,
      [stateKey]: tinyIntVal,
    });
    handleUpdateOnDB(stateKey, tinyIntVal);
  };

  const renderSubtitle = ({ type: inputType, name: fieldName, description }) => {
    const itemDesc = nonEnglish ? i18n.transform(lang, description)?.name : description?.name;
    if (inputType === 'switch' || inputType === 'password') {
      return itemDesc;
    }
    if (fieldName === 'gpsAccuracyLevel' && settingsState?.[fieldName]) {
      const findLevel = accuracyLevels.find((l) => l.value === settingsState[fieldName]);
      return findLevel?.label || itemDesc;
    }
    return settingsState?.[fieldName];
  };

  const loadSettings = useCallback(async () => {
    const selectQuery = query.read('config', { id: 1 });
    const { rows } = await conn.tx(db, selectQuery, [1]);

    const configRows = rows._array[0];
    setSettingsState((s) => ({
      ...s,
      ...configRows,
    }));
  }, []);

  const list = useMemo(() => {
    if (route.params?.id) {
      const findConfig = config.find((c) => c?.id === route.params.id);
      return findConfig ? findConfig.fields : [];
    }
    return [];
  }, [route.params?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <BaseLayout title={pageTitle} rightComponent={false}>
      <BaseLayout.Content>
        <View>
          {list.map((l, i) => {
            const itemTitle = nonEnglish ? i18n.transform(lang, l)?.label : l.label;
            return (
              <ListItem
                key={l.id}
                testID={`settings-form-item-${i}`}
                onPress={() => {
                  if (l.editable && l.type !== 'switch') {
                    handleEditPress(l.id);
                  }
                }}
                bottomDivider
              >
                <ListItem.Content>
                  <ListItem.Title>{itemTitle}</ListItem.Title>
                  <ListItem.Subtitle>{renderSubtitle(l)}</ListItem.Subtitle>
                </ListItem.Content>
                {l.type === 'switch' && (
                  <Switch
                    onValueChange={(value) => handleOnSwitch(value, l.key)}
                    value={settingsState?.[l.name] === 1}
                    testID={`settings-form-switch-${i}`}
                  />
                )}
              </ListItem>
            );
          })}
        </View>
        <DialogForm
          onOk={handleOKPress}
          onCancel={handleCancelPress}
          showDialog={showDialog}
          edit={edit}
          initValue={edit?.value}
        />
      </BaseLayout.Content>
    </BaseLayout>
  );
};

export default SettingsForm;

SettingsForm.propTypes = {
  route: PropTypes.object,
};

SettingsForm.defaultProps = {
  route: null,
};
