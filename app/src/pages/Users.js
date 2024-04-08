import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, BackHandler, Platform, ToastAndroid } from 'react-native';
import { Button, ListItem, Skeleton } from '@rneui/themed';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { BaseLayout } from '../components';
import { conn, query } from '../database';
import { UserState, UIState, AuthState } from '../store';
import { api, i18n } from '../lib';
import { crudConfig } from '../database/crud';

const db = conn.init;

const Users = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const currUserID = UserState.useState((s) => s.id);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  // const goToCreate = () => {
  //   navigation.navigate('AddUser');
  // };

  const loadUsers = useCallback(async () => {
    const selectQuery = query.read('users');
    const { rows } = await conn.tx(db, selectQuery);
    setUsers(rows._array);
    setLoading(false);
  }, []);

  const handleSelectUser = async ({ id, name, password, token, certifications }) => {
    const currUserQuery = query.update('users', { id: currUserID }, { active: 0 });
    await conn.tx(db, currUserQuery, [currUserID]);

    const thisUserQuery = query.update('users', { id }, { active: 1 });
    await conn.tx(db, thisUserQuery, [id]);
    // change passcode when switching users
    await crudConfig.updateConfig({ authenticationCode: password });
    // update axios bearer token & global state
    api.setToken(token);

    AuthState.update((s) => {
      s.token = token;
    });
    UserState.update((s) => {
      s.id = id;
      s.name = name;
      s.certifications = certifications || []
    });
    await loadUsers();

    if (Platform.OS === 'android') {
      ToastAndroid.show(`${trans.usersSwitchTo}${name}`, ToastAndroid.SHORT);
    }
  };

  useEffect(() => {
    if (loading) {
      loadUsers();
    }
    if (!loading && route?.params?.added) {
      const newUser = route.params.added;
      const findNew = users.find((u) => u.id === newUser?.id);
      if (!findNew) {
        setLoading(true);
      }
    }
  }, [loading, route, loadUsers, users]);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate('Home'); // Change the destination force to 'Home'
      return true; // Return true to prevent default back behavior
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      backHandler.remove(); // Cleanup the event listener on component unmount
    };
  }, [navigation]);

  return (
    <BaseLayout
      title={trans.usersPageTitle}
      leftComponent={
        <Button type="clear" onPress={() => navigation.navigate('Home')} testID="arrow-back-button">
          <Icon name="arrow-back" size={18} />
        </Button>
      }
      rightComponent={false}
    >
      <ScrollView>
        {loading && <Skeleton animation="wave" testID="loading-users" />}
        {users.map((user) => (
          <ListItem.Swipeable
            key={user.id}
            onPress={() => handleSelectUser(user)}
            testID={`list-item-user-${user.id}`}
            bottomDivider
          >
            <ListItem.Content>
              <ListItem.Title testID={`title-username-${user.id}`}>{user.name}</ListItem.Title>
            </ListItem.Content>
            {user.active === 1 && (
              <Icon name="checkmark" size={18} testID={`icon-checkmark-${user.id}`} />
            )}
          </ListItem.Swipeable>
        ))}
      </ScrollView>
    </BaseLayout>
  );
};

export default Users;

Users.propTypes = {
  route: PropTypes.object,
};

Users.defaultProps = {
  route: null,
};
