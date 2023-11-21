import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { Asset } from 'expo-asset';
import { View, StyleSheet, Platform, ToastAndroid } from 'react-native';
import { Input, Button, Text, Dialog } from '@rneui/themed';
import { CenterLayout, Image } from '../components';
import { api, cascades, i18n } from '../lib';
import { AuthState, UserState, UIState } from '../store';
import { crudSessions, crudForms, crudUsers, crudConfig } from '../database/crud';

const ToggleEye = ({ hidden, onPress }) => {
  const iconName = hidden ? 'eye' : 'eye-off';
  return (
    <Button type="clear" onPress={onPress} testID="auth-toggle-eye-button">
      <Icon name={iconName} size={24} />
    </Button>
  );
};

const AuthForm = ({ navigation }) => {
  const logo = Asset.fromModule(require('../assets/icon.png')).uri;
  const { online: isNetworkAvailable, lang: activeLang } = UIState.useState((s) => s);
  const [passcode, setPasscode] = React.useState(null);
  const [hidden, setHidden] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const trans = i18n.text(activeLang);

  const toggleHidden = () => setHidden(!hidden);
  const goTo = (page) => navigation.navigate(page);

  const disableLoginButton = React.useMemo(() => !passcode || passcode === '', [passcode]);

  const handleOnPressLogin = () => {
    // check connection
    if (!isNetworkAvailable) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(trans.authErrorNoConn, ToastAndroid.LONG);
      }
      return false;
    }

    setError(null);
    setLoading(true);
    const data = new FormData();
    data.append('code', passcode);
    api
      .post('/auth', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(async (res) => {
        try {
          const { data } = res;
          // save session
          const bearerToken = data.syncToken;
          const lastSession = await crudSessions.selectLastSession();
          if (!lastSession && lastSession?.token !== bearerToken) {
            console.info('Saving tokens...');
            await crudSessions.addSession({ token: bearerToken, passcode });
            api.setToken(bearerToken);
            await crudConfig.updateConfig({ authenticationCode: passcode });
          }
          await cascades.createSqliteDir();
          // save forms
          await data.formsUrl.forEach(async (form) => {
            // Fetch form detail
            const formRes = await api.get(form.url);
            const savedForm = await crudForms.addForm({ ...form, formJSON: formRes?.data });
            console.info('Saved Forms...', form.id, savedForm);

            // download cascades files
            if (formRes?.data?.cascades?.length) {
              formRes.data.cascades.forEach((cascadeFile) => {
                const downloadUrl = api.getConfig().baseURL + cascadeFile;
                cascades.download(downloadUrl, cascadeFile);
              });
            }
          });
          // check users exist
          const activeUser = await crudUsers.getActiveUser();
          // update auth state
          AuthState.update((s) => {
            s.authenticationCode = passcode;
            s.token = bearerToken;
          });
          if (!activeUser || !activeUser?.id) {
            goTo('AddUser');
            return;
          }
          // update user state
          UserState.update((s) => {
            s.id = activeUser.id;
            s.name = activeUser.name;
            s.password = activeUser.password;
          });
          // go to home page (form list)
          goTo('Home');
          return;
        } catch (err) {
          console.error(err);
        }
      })
      .catch((err) => {
        const { status: errStatus } = err?.response;
        if ([400, 401].includes(errStatus)) {
          setError(trans.authErrorPasscode);
        } else {
          setError(err?.message);
        }
      })
      .finally(() => setLoading(false));
  };

  const titles = [trans.authTitle1, trans.authTitle2, trans.authTitle3];
  return (
    <CenterLayout>
      <Image src={logo ? logo : null} />
      <CenterLayout.Titles items={titles} />
      <View style={styles.container}>
        <Input
          placeholder={trans.authInputPasscode}
          secureTextEntry={hidden}
          rightIcon={<ToggleEye hidden={hidden} onPress={toggleHidden} />}
          testID="auth-password-field"
          autoFocus
          value={passcode}
          onChangeText={setPasscode}
        />
        {error && (
          <Text style={styles.errorText} testID="auth-error-text">
            {error}
          </Text>
        )}
      </View>
      <Button
        title="primary"
        disabled={disableLoginButton || loading}
        onPress={handleOnPressLogin}
        testID="auth-login-button"
      >
        {trans.buttonLogin}
      </Button>
      {/* Loading dialog */}
      <Dialog isVisible={loading} style={styles.dialogLoadingContainer}>
        <Dialog.Loading />
        <Text style={styles.dialogLoadingText}>{trans.fetchingData}</Text>
      </Dialog>
    </CenterLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
  },
  checkbox: {
    backgroundColor: '#f9fafb',
  },
  text: {
    marginLeft: 8,
  },
  errorText: { color: 'red', fontStyle: 'italic', marginHorizontal: 10, marginTop: -8 },
  dialogLoadingContainer: {
    flex: 1,
  },
  dialogLoadingText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AuthForm;
