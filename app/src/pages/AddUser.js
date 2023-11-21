import React, { useState, useRef, useEffect } from 'react';
import { View, ToastAndroid, Platform } from 'react-native';
import { ListItem, Button, Input, Text } from '@rneui/themed';
import { Formik, ErrorMessage } from 'formik';
import * as Crypto from 'expo-crypto';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';

import { BaseLayout } from '../components';
import { conn, query } from '../database';
import { UserState, UIState } from '../store';
import { i18n } from '../lib';

db = conn.init;

const AddUser = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);

  const formRef = useRef();
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const rightComponent = userCount ? null : false;

  const goToUsers = () => {
    navigation.navigate('Users');
  };

  const getUsersCount = async () => {
    const { rows } = await conn.tx(db, query.count('users'));
    setUserCount(rows._array?.[0]?.count);
  };

  const checkExistingUser = async (name) => {
    const checkQuery = query.read('users', { name }, true);
    const { rows } = await conn.tx(db, checkQuery, [name]);
    return rows.length;
  };

  const handleInsertDB = (data) => {
    const insertQuery = query.insert('users', data);
    conn
      .tx(db, insertQuery)
      .then(({ insertId }) => {
        if (data?.active) {
          UserState.update((s) => {
            s.id = insertId;
            s.name = data.name;
          });
        }
        if (Platform.OS === 'android') {
          ToastAndroid.show(trans.success, ToastAndroid.SHORT);
        }
        setLoading(false);
        data.active
          ? navigation.navigate('Home')
          : navigation.navigate('Users', { added: { id: insertId } });
      })
      .catch(() => {
        if (Platform.OS === 'android') {
          ToastAndroid.show(trans.errorSaveToDB, ToastAndroid.LONG);
        }
        setLoading(false);
      });
  };

  const submitData = async ({ password, name }) => {
    setLoading(true);
    const passwordEncrypted = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA1,
      password,
    );
    const isActive = userCount === 0 ? 1 : 0;
    const exist = await checkExistingUser(name);
    if (exist) {
      formRef.current.setErrors({ name: trans.errorUserExist });
      setLoading(false);
    } else {
      const data = {
        name,
        password: passwordEncrypted,
        active: isActive,
      };

      handleInsertDB(data);
      formRef.current.resetForm();
    }
  };
  const initialValues = {
    name: null,
    password: '',
    confirmPassword: null,
  };
  const addSchema = Yup.object().shape({
    name: Yup.string().required(trans.errorUserNameRequired),
    password: Yup.string().nullable(),
    confirmPassword: Yup.string().when('password', {
      is: (password) => password && password.length > 0,
      then: (schema) => schema.oneOf([Yup.ref('password')], 'Passwords must match'),
      otherwise: (schema) => schema.nullable(),
    }),
  });

  useEffect(() => {
    getUsersCount();
  }, []);

  return (
    <BaseLayout
      title={trans.addUserPageTitle}
      leftComponent={
        <Button type="clear" onPress={goToUsers} testID="arrow-back-button">
          <Icon name="arrow-back" size={18} />
        </Button>
      }
      rightComponent={rightComponent}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={addSchema}
        innerRef={formRef}
        onSubmit={async (values) => {
          try {
            await submitData(values);
          } catch (err) {
            throw err;
          } finally {
            formRef.current.setSubmitting(false);
          }
        }}
      >
        {({ setFieldValue, values, handleSubmit, isSubmitting }) => (
          <BaseLayout.Content>
            <ListItem>
              <ListItem.Content>
                <ListItem.Title>
                  {`${trans.addUserInputName} `}
                  <Text color="#ff0000">*</Text>
                </ListItem.Title>
                <Input
                  placeholder={trans.addUserInputName}
                  onChangeText={(value) => setFieldValue('name', value)}
                  errorMessage={<ErrorMessage name="name" />}
                  value={values.name}
                  name="name"
                  testID="input-name"
                />
              </ListItem.Content>
            </ListItem>
            {/* <ListItem>
              <ListItem.Content>
                <ListItem.Title>Password</ListItem.Title>
                <Input
                  placeholder="Password"
                  secureTextEntry
                  onChangeText={(value) => setFieldValue('password', value)}
                  value={values.password}
                  errorMessage={<ErrorMessage name="password" />}
                  testID="input-password"
                />
              </ListItem.Content>
            </ListItem>
            <ListItem>
              <ListItem.Content>
                <ListItem.Title>Confirm Password</ListItem.Title>
                <Input
                  placeholder="Confirm Password"
                  secureTextEntry
                  onChangeText={(value) => setFieldValue('confirmPassword', value)}
                  errorMessage={<ErrorMessage name="confirmPassword" />}
                  value={values.confirmPassword}
                  testID="input-confirm-password"
                />
              </ListItem.Content>
            </ListItem> */}

            <View
              style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingHorizontal: 16 }}
            >
              <Button
                onPress={handleSubmit}
                loading={loading}
                disabled={isSubmitting}
                testID="button-save"
              >
                {loading ? trans.buttonSaving : trans.buttonSave}
              </Button>
            </View>
          </BaseLayout.Content>
        )}
      </Formik>
    </BaseLayout>
  );
};

export default AddUser;
