import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ListItem, Divider, Button, Switch } from '@rneui/themed';
import BackgroundService from 'react-native-background-actions';

import { BaseLayout, LogoutButton } from '../components';
import DialogForm from './Settings/DialogForm';
import { config, langConfig } from './Settings/config';
import { UIState, FormState, BuildParamsState } from '../store';
import { backgroundTask, i18n } from '../lib';

const Settings = ({ navigation }) => {
  const [showLang, setShowLang] = useState(false);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const nonEnglish = activeLang !== 'en';
  const activeLangText = langConfig.options.find((o) => o.value === activeLang);
  const authenticationType = BuildParamsState.useState((s) => s.authenticationType);

  const handleSaveLang = (value) => {
    UIState.update((s) => {
      s.lang = value;
    });
    FormState.update((s) => {
      s.lang = value;
    });
    setShowLang(false);
  };

  const goToForm = (id) => {
    const findConfig = config.find((c) => c?.id === id);
    navigation.navigate('SettingsForm', { id, name: findConfig?.name });
  };

  const goToAddForm = () => {
    navigation.navigate('AddNewForm', {});
  };

  const goToFormSelection = () => {
    navigation.navigate('FormSelection');
  };

  const handleOnBackgroundTask = async (isActive = true) => {
    try {
      if (isActive) {
        const taskDesc = 'Sync data submission';
        const options = {
          taskName: SYNC_FORM_SUBMISSION_TASK_NAME,
          taskTitle: SYNC_FORM_SUBMISSION_TASK_NAME,
          taskDesc,
          taskIcon: {
            name: 'ic_launcher',
            type: 'mipmap',
          },
          parameters: {
            delay: 3000,
          },
        };
        const res = await BackgroundService.start(backgroundTask.syncFormSubmission, options);
        console.log('ress', res);
        await BackgroundService.updateNotification({ taskDesc });
      } else {
        await BackgroundService.stop();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <BaseLayout title={trans.settingsPageTitle} rightComponent={false}>
      <BaseLayout.Content>
        <View>
          {/* <ListItem onPress={() => setShowLang(true)} testID="settings-lang" bottomDivider>
            <ListItem.Content>
              <ListItem.Title>{trans.langTitle}</ListItem.Title>
              <ListItem.Subtitle>{activeLangText?.label}</ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem> */}
          <Divider width={8} color="#f9fafb" />
          {config.map((c, i) => {
            const itemTitle = nonEnglish ? i18n.transform(activeLang, c)?.name : c.name;
            const itemDesc = nonEnglish
              ? i18n.transform(activeLang, c?.description)?.name
              : c?.description?.name;
            return (
              <ListItem
                key={i}
                onPress={() => goToForm(c.id)}
                testID={`goto-settings-form-${i}`}
                bottomDivider
              >
                <ListItem.Content>
                  <ListItem.Title>{itemTitle}</ListItem.Title>
                  <ListItem.Subtitle>{itemDesc}</ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Chevron />
              </ListItem>
            );
          })}
          {/* Show this only if no code_assignment in auth type */}
          {!authenticationType.includes('code_assignment') && (
            <>
              <Divider width={8} color="#f9fafb" />
              <ListItem onPress={goToAddForm} testID="add-more-forms" bottomDivider>
                <ListItem.Content>
                  <ListItem.Title>{trans.settingAddFormTitle}</ListItem.Title>
                  <ListItem.Subtitle>{trans.settingAddFormDesc}</ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Chevron />
              </ListItem>
            </>
          )}
          <LogoutButton />
          <DialogForm
            onOk={handleSaveLang}
            onCancel={() => setShowLang(false)}
            showDialog={showLang}
            edit={langConfig}
            initValue={activeLang}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Sync Datapoint" type="outline" onPress={goToFormSelection} />
        </View>
        {/* <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>Auto sync</ListItem.Title>
            <ListItem.Subtitle>This will be running in the background</ListItem.Subtitle>
          </ListItem.Content>
          <Switch onValueChange={handleOnBackgroundTask} />
        </ListItem> */}
      </BaseLayout.Content>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 20,
  },
});

export default Settings;
