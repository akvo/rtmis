import React, { useMemo } from 'react';
import { View } from 'react-native';
import { ListItem, Icon } from '@rneui/themed';
import { BaseLayout } from '../../components';
import { config } from './config';
import { BuildParamsState, UIState } from '../../store';
import { i18n } from '../../lib';

const AboutHome = () => {
  const { appVersion } = BuildParamsState.useState((s) => s);
  const { lang } = UIState.useState((s) => s);
  const nonEnglish = lang !== 'en';
  const trans = i18n.text(lang);

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
          {/* Update button */}
          <ListItem onPress={() => console.info('Update application')}>
            <ListItem.Content>
              <ListItem.Title>{trans.updateApp}</ListItem.Title>
            </ListItem.Content>
            <Icon name="system-update" type="materialicon" />
          </ListItem>
          {/* EOL Update button */}
        </View>
      </BaseLayout.Content>
    </BaseLayout>
  );
};

export default AboutHome;
