import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Platform,
  ToastAndroid,
  BackHandler,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Dialog, Text } from '@rneui/themed';
import Icon from 'react-native-vector-icons/Ionicons';
import { FormContainer } from '../form';
import { SaveDialogMenu, SaveDropdownMenu } from '../form/support';
import { BaseLayout } from '../components';
import { crudDataPoints } from '../database/crud';
import { UserState, UIState, FormState } from '../store';
import { getDurationInMinutes } from '../form/lib';
import { i18n } from '../lib';

const FormPage = ({ navigation, route }) => {
  const selectedForm = FormState.useState((s) => s.form);
  const surveyDuration = FormState.useState((s) => s.surveyDuration);
  const surveyStart = FormState.useState((s) => s.surveyStart);
  const currentValues = FormState.useState((s) => s.currentValues);
  const userId = UserState.useState((s) => s.id);
  const [onSaveFormParams, setOnSaveFormParams] = useState({});
  const [showDialogMenu, setShowDialogMenu] = useState(false);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
  const [showExitConfirmationDialog, setShowExitConfirmationDialog] = useState(false);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  const currentFormId = route?.params?.id;
  // continue saved submission
  const savedDataPointId = route?.params?.dataPointId;
  const isNewSubmission = route?.params?.newSubmission;
  const [currentDataPoint, setCurrentDataPoint] = useState({});
  const [loading, setLoading] = useState(false);

  const refreshForm = () => {
    FormState.update((s) => {
      s.currentValues = {};
      s.questionGroupListCurrentValues = {};
      s.visitedQuestionGroup = [];
      s.cascades = {};
      s.surveyDuration = 0;
    });
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const values = onSaveFormParams?.values;
      if (values && Object.keys(values).length) {
        setShowDialogMenu(true);
        return true;
      }
      refreshForm();
      return false;
    });
    return () => backHandler.remove();
  }, [onSaveFormParams]);

  useEffect(() => {
    if (!isNewSubmission) {
      fetchSavedSubmission().catch((e) => console.error('[Fetch Data Point Failed]: ', e));
    }
  }, [isNewSubmission]);

  const fetchSavedSubmission = useCallback(async () => {
    setLoading(true);
    const dpValue = await crudDataPoints.selectDataPointById({ id: savedDataPointId });
    setCurrentDataPoint(dpValue);
    if (dpValue?.json && Object.keys(dpValue.json)?.length) {
      FormState.update((s) => {
        s.currentValues = dpValue.json;
        s.questionGroupListCurrentValues = dpValue.json;
      });
    }
    setLoading(false);
  }, [savedDataPointId]);

  const formJSON = useMemo(() => {
    if (!selectedForm?.json) {
      return {};
    }
    return JSON.parse(selectedForm.json);
  }, [selectedForm]);

  const onSaveCallback = useCallback((values) => {
    const state = { values };
    setOnSaveFormParams(state);
  }, []);

  const handleOnPressArrowBackButton = () => {
    const values = onSaveFormParams?.values;
    if (values && Object.keys(values).length) {
      setShowDialogMenu(true);
      return;
    }
    refreshForm();
    return navigation.goBack();
  };

  const handleOnSaveAndExit = async () => {
    const { values } = onSaveFormParams;
    try {
      const saveData = {
        form: currentFormId,
        user: userId,
        name: values?.name || trans.untitled,
        submitted: 0,
        duration: surveyDuration,
        json: values?.answers || {},
      };
      const dbCall = isNewSubmission
        ? crudDataPoints.saveDataPoint
        : crudDataPoints.updateDataPoint;
      const duration = getDurationInMinutes(surveyStart) + surveyDuration;
      await dbCall({
        ...currentDataPoint,
        ...saveData,
        duration: duration === 0 ? 1 : duration,
      });
      if (Platform.OS === 'android') {
        ToastAndroid.show(trans.successSaveDatapoint, ToastAndroid.LONG);
      }
      refreshForm();
      navigation.navigate('Home', { ...route?.params });
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'android') {
        ToastAndroid.show(trans.errorSaveDatapoint, ToastAndroid.LONG);
      }
    }
  };

  const handleShowExitConfirmationDialog = () => {
    setShowDropdownMenu(false);
    setShowDialogMenu(false);
    setShowExitConfirmationDialog(true);
  };

  const handleOnExit = () => {
    refreshForm();
    return navigation.navigate('Home');
  };

  const handleOnSubmitForm = async (values) => {
    try {
      const answers = {};
      formJSON.question_group
        .flatMap((qg) => qg.question)
        .forEach((q) => {
          let val = values.answers?.[q.id];
          if (!val && val !== 0) {
            return;
          }
          if (q.type === 'cascade') {
            val = val.slice(-1)[0];
          }
          if (q.type === 'number') {
            val = parseFloat(val);
          }
          answers[q.id] = val;
        });
      // TODO:: submittedAt still null
      const submitData = {
        form: currentFormId,
        user: userId,
        name: values?.name || trans.untitled,
        geo: values.geo,
        submitted: 1,
        duration: surveyDuration,
        json: answers,
      };
      const dbCall = isNewSubmission
        ? crudDataPoints.saveDataPoint
        : crudDataPoints.updateDataPoint;
      const duration = getDurationInMinutes(surveyStart) + surveyDuration;
      await dbCall({
        ...currentDataPoint,
        ...submitData,
        duration: duration === 0 ? 1 : duration,
      });
      if (Platform.OS === 'android') {
        ToastAndroid.show(trans.successSubmitted, ToastAndroid.LONG);
      }
      refreshForm();
      navigation.navigate('Home', { ...route?.params });
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'android') {
        ToastAndroid.show(trans.errorSubmitted, ToastAndroid.LONG);
      }
    }
  };

  return (
    <BaseLayout
      title={route?.params?.name}
      subTitle="formPage"
      leftComponent={
        <Button type="clear" onPress={handleOnPressArrowBackButton} testID="arrow-back-button">
          <Icon name="arrow-back" size={18} />
        </Button>
      }
      rightComponent={
        <SaveDropdownMenu
          visible={showDropdownMenu}
          setVisible={setShowDropdownMenu}
          anchor={
            <Button
              type="clear"
              testID="form-page-kebab-menu"
              onPress={() => setShowDropdownMenu(true)}
            >
              <Icon name="ellipsis-vertical" size={18} />
            </Button>
          }
          handleOnExit={handleShowExitConfirmationDialog}
          handleOnSaveAndExit={handleOnSaveAndExit}
        />
      }
    >
      {!loading ? (
        <FormContainer
          forms={formJSON}
          initialValues={currentValues}
          onSubmit={handleOnSubmitForm}
          onSave={onSaveCallback}
          setShowDialogMenu={setShowDialogMenu}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      )}
      <SaveDialogMenu
        visible={showDialogMenu}
        setVisible={setShowDialogMenu}
        handleOnExit={handleShowExitConfirmationDialog}
        handleOnSaveAndExit={handleOnSaveAndExit}
      />
      <Dialog visible={showExitConfirmationDialog} testID="exit-confirmation-dialog">
        <Text testID="exit-confirmation-text">{trans.confirmExit}</Text>
        <Dialog.Actions>
          <Dialog.Button
            title={trans.buttonExit}
            onPress={handleOnExit}
            testID="exit-confirmation-ok"
          />
          <Dialog.Button
            title={trans.buttonCancel}
            onPress={() => setShowExitConfirmationDialog(false)}
            testID="exit-confirmation-cancel"
          />
        </Dialog.Actions>
      </Dialog>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
});

export default FormPage;
