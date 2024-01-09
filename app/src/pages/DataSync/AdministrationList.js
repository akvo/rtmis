import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ListItem } from '@rneui/themed';
import { BaseLayout } from '../../components';
import { UIState } from '../../store';
import { i18n } from '../../lib';
import Icon from 'react-native-vector-icons/Ionicons';

const FormSelection = ({ navigation, route }) => {
  const params = route?.params || null;
  const [search, setSearch] = useState('');
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  return (
    <BaseLayout
      title={trans.administrationListPageTitle}
      rightComponent={false}
      search={{
        show: true,
        placeholder: trans.homeSearch,
        value: search,
        action: setSearch,
      }}
    >
      <ScrollView>
        <View>
          <ListItem bottomDivider containerStyle={styles.listItemContainer}>
            <ListItem.Content style={styles.listItemContent}>
              <ListItem.Title>sda</ListItem.Title>
              <ListItem.Subtitle>Total Datapoints: 2</ListItem.Subtitle>
              <ListItem.Subtitle>Last synced date: 2</ListItem.Subtitle>
            </ListItem.Content>
            <Button
              icon={<Icon name="sync" size={24} color="white" />}
              buttonStyle={styles.syncButton}
              onPress={() => console.log('Sync button pressed')}
            />
          </ListItem>
        </View>
      </ScrollView>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  listItemContainer: {
    position: 'relative',
    paddingVertical: 20,
  },
  listItemContent: {
    marginRight: 50,
  },
  syncButton: {
    backgroundColor: 'orange',
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 30,
    padding: 10,
  },
});

export default FormSelection;
