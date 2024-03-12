import React, { useState } from 'react';
import { View } from 'react-native';
import { ListItem, Dialog, Text, Icon } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { AuthState, UserState, FormState, UIState } from '../store';
import { conn, query } from '../database';
import { api, cascades, i18n } from '../lib';

const db = conn.init;

const LogoutButton = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  const handleNoPress = () => {
    setVisible(false);
  };

  const handleYesPress = async () => {
    const tables = ['sessions', 'users', 'forms', 'config', 'datapoints', 'jobs', 'monitoring'];
    const clearQuery = query.clear(tables);
    setLoading(true);
    await conn.tx(db, clearQuery);
    AuthState.update((s) => {
      s.token = null;
    });
    UserState.update((s) => {
      s.id = null;
      s.name = null;
      s.password = '';
    });
    setLoading(false);
    setVisible(false);

    FormState.update((s) => {
      s.form = {};
      s.currentValues = {}; // answers
      s.visitedQuestionGroup = [];
      s.cascades = {};
      s.surveyDuration = 0;
    });

    /**
     * Remove sqlite files
     */
    await cascades.dropFiles();
    /**
     * Reset axios token
     */
    api.setToken(null);

    navigation.navigate('GetStarted');
  };

  return (
    <View>
      <ListItem onPress={() => setVisible(true)} testID="list-item-logout">
        <ListItem.Content>
          <ListItem.Title>{trans.buttonReset}</ListItem.Title>
        </ListItem.Content>
        <Icon name="refresh" type="ionicon" />
      </ListItem>
      <Dialog testID="dialog-confirm-logout" isVisible={visible}>
        {loading ? <Dialog.Loading /> : <Text>{trans.confirmReset}</Text>}
        <Dialog.Actions>
          <Dialog.Button onPress={handleYesPress} testID="dialog-button-yes">
            {trans.buttonYes}
          </Dialog.Button>
          <Dialog.Button onPress={handleNoPress} testID="dialog-button-no">
            {trans.buttonNo}
          </Dialog.Button>
        </Dialog.Actions>
      </Dialog>
    </View>
  );
};

export default LogoutButton;
