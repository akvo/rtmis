import React, { useState, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import { ListItem, Switch } from '@rneui/themed';
import * as Crypto from 'expo-crypto';
import { BaseLayout } from '../../components';
import { config } from './config';
import { BuildParamsState, UIState, AuthState, UserState } from '../../store';
import { conn, query } from '../../database';
import DialogForm from './DialogForm';
import { backgroundTask, i18n } from '../../lib';

const db = conn.init;

const SettingsForm = ({ route }) => {
  const [edit, setEdit] = useState(null);
  const [list, setList] = useState([]);
  const [showDialog, setShowDialog] = useState(false);

  const {
    serverURL,
    appVersion,
    dataSyncInterval: syncInterval,
  } = BuildParamsState.useState((s) => s);
  const { password, authenticationCode, useAuthenticationCode } = AuthState.useState((s) => s);
  const { lang, isDarkMode, fontSize } = UIState.useState((s) => s);
  const { name, syncWifiOnly } = UserState.useState((s) => s);
  const store = {
    AuthState,
    BuildParamsState,
    UIState,
    UserState,
  };
  const [settingsState, setSettingsState] = useState({
    serverURL,
    name,
    password,
    authenticationCode,
    useAuthenticationCode,
    lang,
    isDarkMode,
    fontSize,
    syncInterval,
    syncWifiOnly,
  });

  const nonEnglish = lang !== 'en';
  const curConfig = config.find((c) => c.id === route?.params?.id);
  const pageTitle = nonEnglish ? i18n.transform(lang, curConfig)?.name : route?.params.name;

  const editState = useMemo(() => {
    if (edit && edit?.key) {
      const [stateName, stateKey] = edit?.key?.split('.');
      return [store[stateName], stateKey];
    }
    return null;
  }, [edit]);

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
    ];
    const id = 1;
    if (configFields.includes(field)) {
      const updateQuery = query.update('config', { id }, { [field]: value });
      await conn.tx(db, updateQuery, [id]);
    }
    if (configFields.includes('syncInterval')) {
      await backgroundTask.unregisterBackgroundTask('sync-form-submission');
      await backgroundTask.registerBackgroundTask('sync-form-submission', parseInt(value));
      BuildParamsState.update((s) => {
        s.dataSyncInterval = value;
      });
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

  const handleOKPress = (inputValue) => {
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
      handleUpdateOnDB(stateKey, inputValue);
      setEdit(null);
    }
  };
  const handleCancelPress = () => {
    setShowDialog(false);
    setEdit(null);
  };

  const handleOnSwitch = (value, key) => {
    const [stateName, stateKey] = key?.split('.');
    store[stateName].update((s) => {
      s[stateKey] = value;
    });
    setSettingsState({
      ...settingsState,
      [stateKey]: value,
    });
    const tinyIntVal = value ? 1 : 0;
    handleUpdateOnDB(stateKey, tinyIntVal);
  };

  const handleCreateNewConfig = () => {
    const insertQuery = query.insert('config', {
      id: 1,
      appVersion,
      authenticationCode: 'testing',
      serverURL,
      syncInterval,
      syncWifiOnly,
      lang,
    });
    conn.tx(db, insertQuery, []);
  };

  const settingsID = useMemo(() => {
    return route?.params?.id;
  }, [route]);

  useEffect(() => {
    const findConfig = config.find((c) => c?.id === settingsID);
    const fields = findConfig ? findConfig.fields : [];
    setList(fields);
  }, [settingsID]);

  useEffect(() => {
    const selectQuery = query.read('config', { id: 1 });
    conn.tx(db, selectQuery, [1]).then(({ rows }) => {
      if (rows.length) {
        const configRows = rows._array[0];
        setSettingsState({
          ...settingsState,
          ...configRows,
          syncInterval,
        });
      } else {
        handleCreateNewConfig();
      }
    });
  }, []);
  return (
    <BaseLayout title={pageTitle} rightComponent={false}>
      <BaseLayout.Content>
        <View>
          {list.map((l, i) => {
            const switchValue =
              l.type === 'switch' && (settingsState[l.name] || false) ? true : false;
            const listProps =
              l.editable && l.type !== 'switch' ? { onPress: () => handleEditPress(l.id) } : {};

            const itemTitle = nonEnglish ? i18n.transform(lang, l)?.label : l.label;
            const itemDesc = nonEnglish
              ? i18n.transform(lang, l?.description)?.name
              : l?.description?.name;
            const subtitle =
              l.type === 'switch' || l.type === 'password'
                ? itemDesc
                : settingsState[l.name] || itemDesc;
            return (
              <ListItem key={i} {...listProps} testID={`settings-form-item-${i}`} bottomDivider>
                <ListItem.Content>
                  <ListItem.Title>{itemTitle}</ListItem.Title>
                  <ListItem.Subtitle>{subtitle}</ListItem.Subtitle>
                </ListItem.Content>
                {l.type === 'switch' && (
                  <Switch
                    onValueChange={(value) => handleOnSwitch(value, l.key)}
                    value={switchValue}
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
        />
      </BaseLayout.Content>
    </BaseLayout>
  );
};

export default SettingsForm;
