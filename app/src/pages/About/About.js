import React, { useState, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import { ListItem } from '@rneui/themed';
import { BaseLayout } from '../../components';
import { config } from './config';
import { BuildParamsState, UIState } from '../../store';

const AboutHome = ({}) => {
  const [list, setList] = useState([]);
  const [settingsState, setSettingsState] = useState({
    appVersion,
  });
  const { appVersion } = BuildParamsState.useState((s) => s);
  const { lang } = UIState.useState((s) => s);
  const nonEnglish = lang !== 'en';

  useEffect(() => {
    const findConfig = config.find((c) => c?.id === 1);
    const fields = findConfig ? findConfig.fields : [];
    setList(fields);
  }, []);

  useEffect(() => {
    setSettingsState({
      appVersion,
    });
  }, []);

  return (
    <BaseLayout title="About" rightComponent={false}>
      <BaseLayout.Content>
        <View>
          {list.map((l, i) => {
            const itemTitle = nonEnglish ? i18n.transform(lang, l)?.label : l.label;
            const itemDesc = nonEnglish
              ? i18n.transform(lang, l?.description)?.name
              : l?.description;
            console.log(settingsState, 'itemDesc');
            const subtitle = l.type === 'text' ? itemDesc : settingsState[l.name] || itemDesc;
            return (
              <ListItem key={i} bottomDivider>
                <ListItem.Content>
                  <ListItem.Title>{itemTitle}</ListItem.Title>
                  <ListItem.Subtitle>{subtitle}</ListItem.Subtitle>
                </ListItem.Content>
              </ListItem>
            );
          })}
        </View>
      </BaseLayout.Content>
    </BaseLayout>
  );
};

export default AboutHome;
