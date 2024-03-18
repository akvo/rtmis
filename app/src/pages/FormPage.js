/* eslint-disable no-console */
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
import * as SQLite from 'expo-sqlite';
import PropTypes from 'prop-types';
import FormContainer from '../form/FormContainer';
import { SaveDialogMenu, SaveDropdownMenu } from '../form/support';
import { BaseLayout } from '../components';
import { crudDataPoints } from '../database/crud';
import { UserState, UIState, FormState } from '../store';
import { generateDataPointName, getDurationInMinutes } from '../form/lib';
import { i18n } from '../lib';
import crudJobs, { jobStatus } from '../database/crud/crud-jobs';
import { SYNC_FORM_SUBMISSION_TASK_NAME } from '../lib/background-task';

const FormPage = ({ navigation, route }) => {
  const selectedForm = FormState.useState((s) => s.form);
  const surveyDuration = FormState.useState((s) => s.surveyDuration);
  const surveyStart = FormState.useState((s) => s.surveyStart);
  const currentValues = FormState.useState((s) => s.currentValues);
  const cascades = FormState.useState((s) => s.cascades);
  const userId = UserState.useState((s) => s.id);
  const [showDialogMenu, setShowDialogMenu] = useState(false);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
  const [showExitConfirmationDialog, setShowExitConfirmationDialog] = useState(false);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  const currentFormId = route?.params?.id;
  const isMonitoring = route?.params?.isMonitoring;
  // continue saved submission
  const savedDataPointId = route?.params?.dataPointId;
  const isNewSubmission = route?.params?.newSubmission;
  const [currentDataPoint, setCurrentDataPoint] = useState({});
  const [loading, setLoading] = useState(false);

  const formJSON = useMemo(() => {
    if (!selectedForm?.json) {
      return {};
    }
    return JSON.parse(selectedForm.json);
  }, [selectedForm]);

  const refreshForm = useCallback(() => {
    /**
     * Close connection for all cascade SQLite
     */
    const { cascades: cascadesFiles } = formJSON || {};
    cascadesFiles?.forEach((csFile) => {
      const [dbFile] = csFile?.split('/')?.slice(-1) || [];
      const connDB = SQLite.openDatabase(dbFile);
      connDB.closeAsync();
    });

    FormState.update((s) => {
      s.currentValues = {};
      s.visitedQuestionGroup = [];
      s.cascades = {};
      s.surveyDuration = 0;
    });
  }, [formJSON]);

  const handleOnPressArrowBackButton = () => {
    if (Object.keys(currentValues).length) {
      setShowDialogMenu(true);
      return;
    }
    refreshForm();
    navigation.goBack();
  };

  const handleOnSaveAndExit = async () => {
    const { dpName } = generateDataPointName(formJSON, currentValues, cascades);
    try {
      const saveData = {
        form: currentFormId,
        user: userId,
        name: dpName || trans.untitled,
        submitted: 0,
        duration: surveyDuration,
        json: currentValues || {},
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
    } catch (error) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(`SQL: ${error}`, ToastAndroid.LONG);
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
          const val = values.answers?.[q.id];
          if (!val && val !== 0) {
            return;
          }
          answers[q.id] = val;
          if (q.type === 'cascade' && Array.isArray(val) && val.length) {
            const [cascadeValue] = val.slice(-1);
            answers[q.id] = cascadeValue;
          }
          if (q.type === 'number') {
            answers[q.id] = parseFloat(val);
          }
        });

      const datapoitName = values?.name || trans.untitled;
      const submitData = {
        form: currentFormId,
        user: userId,
        name: datapoitName,
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
      /**
       * Create a new job for syncing form submissions.
       */
      await crudJobs.addJob({
        user: userId,
        type: SYNC_FORM_SUBMISSION_TASK_NAME,
        status: jobStatus.PENDING,
        info: `${currentFormId} | ${datapoitName}`,
      });

      if (Platform.OS === 'android') {
        ToastAndroid.show(trans.successSubmitted, ToastAndroid.LONG);
      }
      refreshForm();
      navigation.navigate('Home', { ...route?.params });
    } catch (error) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(`SQL: ${error}`, ToastAndroid.LONG);
      }
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (Object.keys(currentValues).length) {
        setShowDialogMenu(true);
        return true;
      }
      refreshForm();
      return false;
    });
    return () => backHandler.remove();
  }, [currentValues, refreshForm]);

  const fetchSavedSubmission = useCallback(async () => {
    setLoading(true);
    const dpValue = await crudDataPoints.selectDataPointById({ id: savedDataPointId });
    setCurrentDataPoint(dpValue);
    if (dpValue?.json && Object.keys(dpValue.json)?.length) {
      FormState.update((s) => {
        s.currentValues = dpValue.json;
      });
    }
    setLoading(false);
  }, [savedDataPointId]);

  useEffect(() => {
    if (!isNewSubmission) {
      fetchSavedSubmission().catch((e) => console.error('[Fetch Data Point Failed]: ', e));
    }
  }, [isNewSubmission, fetchSavedSubmission]);

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
          onSubmit={handleOnSubmitForm}
          setShowDialogMenu={setShowDialogMenu}
          isMonitoring={isMonitoring}
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

FormPage.propTypes = {
  route: PropTypes.object,
};

FormPage.defaultProps = {
  route: null,
};
