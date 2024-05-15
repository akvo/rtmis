import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { ListItem, Icon, Dialog, Text } from '@rneui/themed';
import { BaseLayout } from '../../components';
import { config } from './config';
import { BuildParamsState, UIState } from '../../store';
import { i18n } from '../../lib';
import { api } from '../../lib';

const AboutHome = () => {
  const { appVersion } = BuildParamsState.useState((s) => s);
  const { lang } = UIState.useState((s) => s);
  const nonEnglish = lang !== 'en';
  const trans = i18n.text(lang);
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState('');

  const list = useMemo(() => {
    const findConfig = config.find((c) => c?.id === 1);
    return findConfig?.fields || [];
  }, []);

  const handleUpdateApp = () => {
    setChecking(true);
    setVisible(true);
    api
      .get(`/apk/version/${String(appVersion)}`)
      .then((res) => {
        //update
        console.log(res, '======= UPDATE');
      })
      .catch((e) => {
        // no update
        console.log(e, '======== NOT UPDATE');
        setUpdateInfo(trans.noUpdateFound);
      })
      .finally(() => {
        console.log('HAHAHAHA');
        setChecking(false);
      });
  };

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
          <ListItem onPress={handleUpdateApp}>
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
                <Text>{trans.checkingVersion}</Text>
              </View>
            ) : (
              <Text>{updateInfo}</Text>
            )}
            <Dialog.Actions>
              <Dialog.Button onPress={() => console.info('aaa')}>
                {trans.buttonUpdate}
              </Dialog.Button>
              <Dialog.Button onPress={() => setVisible(false)}>{trans.buttonCancel}</Dialog.Button>
            </Dialog.Actions>
          </Dialog>
        </View>
      </BaseLayout.Content>
    </BaseLayout>
  );
};

export default AboutHome;
