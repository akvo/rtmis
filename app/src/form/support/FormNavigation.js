import React from 'react';
import { ToastAndroid } from 'react-native';
import { Tab } from '@rneui/themed';
import { styles } from '../styles';
import { UIState, FormState } from '../../store';
import { i18n } from '../../lib';
import { generateValidationSchemaFieldLevel, onFilterDependency } from '../lib';

const FormNavigation = ({
  currentGroup,
  onSubmit,
  activeGroup,
  setActiveGroup,
  totalGroup,
  showQuestionGroupList,
  setShowQuestionGroupList,
  setShowDialogMenu,
}) => {
  const visitedQuestionGroup = FormState.useState((s) => s.visitedQuestionGroup);
  const currentValues = FormState.useState((s) => s.currentValues);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  const handleOnUpdateState = (activeValue) => {
    const updateVisitedQuestionGroup = [...visitedQuestionGroup, ...[activeValue]];
    FormState.update((s) => {
      s.visitedQuestionGroup = [...new Set(updateVisitedQuestionGroup)];
    });
  };

  const handleFormNavigation = async (index) => {
    // index 0 = prev group
    // index 1 = show question group list
    // index 2 = next group
    const validateSync = currentGroup?.question
      ?.filter((q) => onFilterDependency(currentGroup, currentValues, q))
      ?.map((q) => {
        const defaultVal = ['cascade', 'multiple_option', 'option', 'geo'].includes(q?.type)
          ? null
          : '';
        /**
         * Set default value when the answer is undefined
         */
        const fieldValue = currentValues?.[q?.id] === undefined ? defaultVal : currentValues[q.id];
        return generateValidationSchemaFieldLevel(fieldValue, q);
      });
    const validations = await Promise.allSettled(validateSync);
    const feedbackList = validations
      ?.filter(({ status }) => status === 'fulfilled')
      .map(({ value }) => value);
    const feedbackValues = feedbackList.reduce((acc, obj) => {
      const key = Object.keys(obj)[0];
      const value = obj[key];
      acc[key] = value;
      return acc;
    }, {});
    const errors = Object.values(feedbackValues).filter((val) => val !== true);
    if (errors.length > 0 && index === 2) {
      ToastAndroid.show(trans.mandatoryQuestions, ToastAndroid.LONG);
    }
    FormState.update((s) => {
      s.feedback = feedbackValues;
    });

    if (index === 2 && errors.length) {
      return;
    }
    if (!visitedQuestionGroup.includes(currentGroup?.id)) {
      FormState.update((s) => {
        s.visitedQuestionGroup = [...visitedQuestionGroup, currentGroup.id];
      });
    }

    if (index === 0) {
      if (activeGroup > 0) {
        setActiveGroup(activeGroup - 1);
      }
      if (!activeGroup) {
        setShowDialogMenu(true);
      } else {
        const activeValue = activeGroup - 1;
        setActiveGroup(activeValue);
        handleOnUpdateState(activeValue);
      }
      return;
    }
    if (index === 1) {
      setShowQuestionGroupList(!showQuestionGroupList);
      return;
    }
    if (index === 2 && activeGroup < totalGroup - 1) {
      setActiveGroup(activeGroup + 1);
    }
    if (index === 2 && !errors.length && activeGroup === totalGroup - 1) {
      onSubmit();
    }
  };

  return (
    <Tab
      buttonStyle={styles.formNavigationButton}
      onChange={handleFormNavigation}
      disableIndicator={true}
      value={activeGroup}
    >
      <Tab.Item
        title={trans.buttonBack}
        icon={{ name: 'chevron-back-outline', type: 'ionicon', color: 'grey', size: 20 }}
        iconPosition="left"
        iconContainerStyle={styles.formNavigationIcon}
        titleStyle={styles.formNavigationTitle}
        testID="form-nav-btn-back"
        disabled={showQuestionGroupList}
        disabledStyle={{ backgroundColor: 'transparent' }}
      />
      <Tab.Item
        title={`${activeGroup + 1}/${totalGroup}`}
        titleStyle={styles.formNavigationGroupCount}
        testID="form-nav-group-count"
      />
      {activeGroup < totalGroup - 1 ? (
        <Tab.Item
          title={trans.buttonNext}
          icon={{ name: 'chevron-forward-outline', type: 'ionicon', color: 'grey', size: 20 }}
          iconPosition="right"
          iconContainerStyle={styles.formNavigationIcon}
          titleStyle={styles.formNavigationTitle}
          testID="form-nav-btn-next"
          disabled={showQuestionGroupList}
          disabledStyle={{ backgroundColor: 'transparent' }}
        />
      ) : (
        <Tab.Item
          title={trans.buttonSubmit}
          icon={{ name: 'paper-plane-outline', type: 'ionicon', color: 'grey', size: 20 }}
          iconPosition="right"
          iconContainerStyle={styles.formNavigationIcon}
          titleStyle={styles.formNavigationSubmit}
          testID="form-btn-submit"
        />
      )}
    </Tab>
  );
};

export default FormNavigation;
