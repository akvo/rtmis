import React, { useMemo } from 'react';
import { View } from 'react-native';
import { ListItem } from '@rneui/themed';
import { BaseLayout } from '../../components';
import { config } from './config';
import { BuildParamsState, UIState } from '../../store';
import { i18n } from '../../lib';

const AboutHome = () => {
  const { appVersion } = BuildParamsState.useState((s) => s);
  const { lang } = UIState.useState((s) => s);
  const nonEnglish = lang !== 'en';

  const list = useMemo(() => {
    const findConfig = config.find((c) => c?.id === 1);
    return findConfig?.fields || [];
  }, []);

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
        </View>
      </BaseLayout.Content>
    </BaseLayout>
  );
};

export default AboutHome;
