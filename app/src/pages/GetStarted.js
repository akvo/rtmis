import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Asset } from 'expo-asset';
import { Text, Button, Input } from '@rneui/themed';
import { CenterLayout, Image } from '../components';
import { BuildParamsState, UIState } from '../store';
import { api, i18n } from '../lib';
import { crudConfig } from '../database/crud';
import { ToastAndroid } from 'react-native';
import * as FileSystem from 'expo-file-system';

const GetStarted = ({ navigation }) => {
  const logo = Asset.fromModule(require('../assets/icon.png')).uri;
  const [currentConfig, setCurrentConfig] = useState({});
  const [IPAddr, setIPAddr] = useState(null);
  const serverURLState = BuildParamsState.useState((s) => s.serverURL);
  const authenticationType = BuildParamsState.useState((s) => s.authenticationType);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  const getConfig = useCallback(async () => {
    const config = await crudConfig.getConfig();
    if (config) {
      setCurrentConfig(config);
    }
  }, []);

  const isServerURLDefined = useMemo(() => {
    return currentConfig?.serverURL || serverURLState;
  }, [currentConfig?.serverURL, serverURLState]);

  useEffect(() => {
    getConfig();
  }, [getConfig]);

  const goToLogin = async () => {
    if (IPAddr) {
      BuildParamsState.update((s) => {
        s.serverURL = IPAddr;
      });
      api.setServerURL(IPAddr);
      // save server URL
      await crudConfig.updateConfig({ serverURL: IPAddr });
    }
    setTimeout(() => {
      if (authenticationType.includes('code_assignment')) {
        navigation.navigate('AuthForm');
        return;
      }
      navigation.navigate('AuthByPassForm');
    }, 100);
  };

  useEffect(() => {
    checkStorageSpace();
  }, []);

  const checkStorageSpace = async () => {
    try {
      const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
      const freeDiskSpaceMB = freeDiskStorage / (1024 * 1024);
      const thresholdMB = 100; 
      if (freeDiskSpaceMB < thresholdMB) {
        ToastAndroid.show("Low free disk space! Please free up some space.", ToastAndroid.SHORT);
      }
    } catch (error) {
      console.warn('Error checking storage space:', error);
    }
  };

  const titles = [trans.getStartedTitle1, trans.getStartedTitle2, trans.getStartedTitle3];
  return (
    <CenterLayout title={titles}>
      <Image src={logo ? logo : null} />
      <CenterLayout.Titles items={titles} />
      <Text>{trans.getStartedSubTitle}</Text>
      {!isServerURLDefined && (
        <Input
          placeholder={trans.getStartedInputServer}
          onChangeText={setIPAddr}
          testID="server-url-field"
        />
      )}
      <Button title="primary" onPress={goToLogin} testID="get-started-button">
        {trans.buttonGetStarted}
      </Button>
    </CenterLayout>
  );
};

export default GetStarted;
