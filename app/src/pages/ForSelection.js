import React from 'react';
import { ScrollView, View } from 'react-native';
import { ListItem } from '@rneui/themed';
import { BaseLayout } from '../components';
import { UIState } from '../store';
import { i18n } from '../lib';

const FormSelection = ({ navigation, route }) => {
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  return (
    <BaseLayout title={trans.formSelectionPageTitle} rightComponent={false}>
      <ScrollView>
        <View>
          <ListItem bottomDivider>
            <ListItem.Content>
              <ListItem.Title>Wash</ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        </View>
      </ScrollView>
    </BaseLayout>
  );
};

export default FormSelection;
