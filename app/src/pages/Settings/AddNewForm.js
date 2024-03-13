import React, { useState } from 'react';
import { View, StyleSheet, Platform, ToastAndroid } from 'react-native';
import { Input, Button, Text, Dialog } from '@rneui/themed';
import { BaseLayout } from '../../components';
import { i18n, api, cascades } from '../../lib';
import { UIState } from '../../store';
import { crudForms } from '../../database/crud';

const AddNewForm = ({ navigation }) => {
  const { online: isNetworkAvailable, lang: activeLang } = UIState.useState((s) => s);
  const trans = i18n.text(activeLang);
  const [loading, setLoading] = useState(false);
  const [formId, setFormId] = useState(null);
  const [error, setError] = useState(null);

  const handleDownloadForm = () => {
    if (!isNetworkAvailable) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(trans.authErrorNoConn, ToastAndroid.LONG);
      }
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get(`/forms/${formId}`)
      .then(async (res) => {
        try {
          const { data } = res;
          await cascades.createSqliteDir();
          // save forms
          const savedForm = await crudForms.addForm({
            id: data.id,
            version: data.version,
            formJSON: data,
          });
          console.info('Saved Forms...', data.id, savedForm);
          // download cascades files
          if (data?.cascades?.length) {
            data.cascades.forEach((cascadeFile) => {
              const downloadUrl = api.getConfig().baseURL + cascadeFile;
              cascades.download(downloadUrl, cascadeFile);
            });
          }
          setTimeout(() => {
            navigation.navigate('Home');
          }, 100);
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

  return (
    <BaseLayout title={trans.settingAddNewFormPageTitle} rightComponent={false}>
      <BaseLayout.Content>
        <View style={styles.container}>
          <Input
            placeholder={trans.inputFormID}
            testID="input-form-id"
            autoFocus
            value={formId}
            onChangeText={setFormId}
            keyboardType="numeric"
            inputContainerStyle={styles.inputFormId}
          />
          <Button testID="button-download-form" onPress={handleDownloadForm}>
            {trans.downloadFormButton}
          </Button>
          {error && (
            <Text style={styles.errorText} testID="fetch-error-text">
              {error}
            </Text>
          )}
        </View>
      </BaseLayout.Content>
      {/* Loading dialog */}
      <Dialog isVisible={loading} style={styles.dialogLoadingContainer}>
        <Dialog.Loading />
        <Text style={styles.dialogLoadingText}>{trans.fetchingData}</Text>
      </Dialog>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  inputFormId: {
    width: '100%',
  },
  errorText: { color: 'red', fontStyle: 'italic', marginHorizontal: 10, marginTop: 8 },
  dialogLoadingContainer: {
    flex: 1,
  },
  dialogLoadingText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AddNewForm;
