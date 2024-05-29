import React, { useMemo, useState, useCallback } from 'react';
import { View, Linking, Alert } from 'react-native';
import { ListItem, Icon, Dialog, Text } from '@rneui/themed';
import * as Sentry from '@sentry/react-native';
import { BaseLayout } from '../../components';
import { config } from './config';
import { BuildParamsState, UIState } from '../../store';
import { i18n, api } from '../../lib';

const AboutHome = () => {
  const { appVersion, apkURL } = BuildParamsState.useState((s) => s);
  const { lang } = UIState.useState((s) => s);
  const nonEnglish = lang !== 'en';
  const trans = i18n.text(lang);
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({ status: null, text: '' });

  const list = useMemo(() => {
    const findConfig = config.find((c) => c?.id === 1);
    return findConfig?.fields || [];
  }, []);

  const handleCheckAppVersion = () => {
    setChecking(true);
    setVisible(true);
    api
      .get(`/apk/version/${appVersion}`)
      .then((res) => {
        // update
        setUpdateInfo({
          status: 200,
          text: `${trans.newVersionAvailable} (v ${res.data.version})`,
        });
      })
      .catch((e) => {
        // no update
        Sentry.captureMessage('[About] Unable to fetch app version');
        Sentry.captureException(e);
        setUpdateInfo({ status: e?.response?.status || 500, text: trans.noUpdateFound });
      })
      .finally(() => {
        setChecking(false);
      });
  };

  const handleUpdateButton = useCallback(async () => {
    // if the link is supported for links with custom URL scheme.
    const supported = await Linking.canOpenURL(apkURL);
    if (supported) {
      // Opening the link with some app, if the URL scheme is "http" the web link should be opened
      // by some browser in the mobile
      await Linking.openURL(apkURL);
    } else {
      Alert.alert(`Don't know how to open this URL: ${apkURL}`);
    }
  }, [apkURL]);

  return (
    <BaseLayout title="About" rightComponent={false}>
      <BaseLayout.Content>
        <View>
          {list.map((l) => {
            const itemTitle = nonEnglish ? i18n.transform(lang, l)?.label : l.label;
            const itemDesc = nonEnglish
              ? i18n.transform(lang, l?.description)?.name
              : l?.description;
            const subtitle = l.type === 'text' ? itemDesc : appVersion || itemDesc;
            return (
              <ListItem key={l.id} bottomDivider>
                <ListItem.Content>
                  <ListItem.Title>{itemTitle}</ListItem.Title>
                  <ListItem.Subtitle>{subtitle}</ListItem.Subtitle>
                </ListItem.Content>
              </ListItem>
            );
          })}
          {/* Update button */}
          <ListItem onPress={handleCheckAppVersion}>
            <ListItem.Content>
              <ListItem.Title>{trans.updateApp}</ListItem.Title>
            </ListItem.Content>
            <Icon name="system-update" type="materialicon" />
          </ListItem>
          {/* EOL Update button */}

          <Dialog isVisible={visible}>
            {checking ? (
              <View>
                <Dialog.Loading />
                <Text style={{ textAlign: 'center' }}>{trans.checkingVersion}</Text>
              </View>
            ) : (
              <View>
                <Text>{updateInfo.text}</Text>
                <Dialog.Actions>
                  {updateInfo.status === 200 ? (
                    <Dialog.Button onPress={handleUpdateButton}>{trans.buttonUpdate}</Dialog.Button>
                  ) : (
                    ''
                  )}
                  <Dialog.Button onPress={() => setVisible(false)}>
                    {trans.buttonCancel}
                  </Dialog.Button>
                </Dialog.Actions>
              </View>
            )}
          </Dialog>
        </View>
      </BaseLayout.Content>
    </BaseLayout>
  );
};

export default AboutHome;
