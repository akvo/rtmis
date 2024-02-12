import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';
import { Button, ListItem } from '@rneui/themed';
import { BaseLayout } from '../components';
import { UIState, FormState, UserState } from '../store';
import { i18n, api } from '../lib';
import { getCurrentTimestamp } from '../form/lib';
import { crudForms } from '../database/crud';
import crudJobs, { SYNC_DATAPOINT_JOB_NAME, jobStatus } from '../database/crud/crud-jobs';

const ManageForm = ({ navigation, route }) => {
  const draftCount = FormState.useState((s) => s.form?.draft);
  const submittedCount = FormState.useState((s) => s.form?.submitted);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const userId = UserState.useState((s) => s.id);
  const [activeJobByForm, setActiveJobByForm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const goToNewForm = () => {
    FormState.update((s) => {
      s.surveyStart = getCurrentTimestamp();
      s.prefilled = false;
    });
    navigation.navigate('FormPage', { ...route?.params, newSubmission: true });
  };

  const goToUpdateForm = () => {
    FormState.update((s) => {
      s.surveyStart = getCurrentTimestamp();
      s.prefilled = false;
    });
    navigation.navigate('UpdateForm', { ...route?.params, monitoring: true, newSubmission: true });
  };

  const items = [
    {
      id: 1,
      text: trans.manageNewBlank,
      icon: 'clipboard-outline',
      goTo: goToNewForm,
    },
    // /* TODO: Enable this when we have a way to update a form
    {
      id: 2,
      text: trans.manageUpdate,
      icon: 'clipboard-edit-outline',
      goTo: goToUpdateForm,
    },
    // */
    {
      id: 3,
      text: `${trans.manageEditSavedForm} (${draftCount})`,
      icon: 'folder-open',
      goTo: () => navigation.navigate('FormData', { ...route?.params, showSubmitted: false }),
    },
    {
      id: 4,
      text: `${trans.manageViewSubmitted} (${submittedCount})`,
      icon: 'eye',
      goTo: () => navigation.navigate('FormData', { ...route?.params, showSubmitted: true }),
    },
  ];

  // useEffect(() => {
  //   const fetchActiveJob = async () => {
  //     const job = await crudJobs.getActiveJob(SYNC_DATAPOINT_JOB_NAME, route.params.formId);
  //     setActiveJobByForm(job);
  //   };

  //   fetchActiveJob();
  // }, [route.params.formId]);

  const handleGetForm = async (userID) => {
    try {
      const formRes = await api.get(`/form/${route.params.formId}`);
      const apiData = formRes.data;

      if (apiData.cascades) {
        apiData.cascades.forEach((cascadeFile) => {
          const downloadUrl = api.getConfig().baseURL + cascadeFile;
          cascades.download(downloadUrl, cascadeFile);
        });
      }

      const savedForm = await crudForms.addForm({
        formId: route.params.formId,
        version: apiData.version,
        userId: userID,
        formJSON: apiData,
      });

      console.info('Saved Form...', savedForm);
    } catch (error) {
      console.error('Error handling form:', error);
    }
  };

  const handleOnSyncClick = async () => {
    setIsLoading(true);
    try {
      await handleGetForm(userId);
      await crudJobs.addJob({
        form: route.params.formId,
        user: userId,
        type: SYNC_DATAPOINT_JOB_NAME,
        status: jobStatus.PENDING,
      });
    } catch (error) {
      console.error('Error syncing data:', error);
    }
    setIsLoading(false);
  };

  return (
    <BaseLayout title={route?.params?.name} rightComponent={false}>
      <BaseLayout.Content>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 16,
          }}
        >
          {items.map((i, ix) => (
            <ListItem key={ix} onPress={() => i.goTo()} testID={`goto-item-${ix}`}>
              <Icon name={i.icon} color="grey" size={18} />
              <ListItem.Content>
                <ListItem.Title>{i.text}</ListItem.Title>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          ))}
        </View>
      </BaseLayout.Content>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Button
          title={activeJobByForm || isLoading ? trans.loadingText : trans.syncDataPointBtn}
          disabled={isLoading}
          type="outline"
          onPress={handleOnSyncClick}
        />
      </View>
    </BaseLayout>
  );
};

export default ManageForm;
