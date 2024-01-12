import React, { useEffect } from 'react';
import { Platform, ToastAndroid } from 'react-native';
import { Tab } from '@rneui/themed';
import { styles } from '../styles';
import { UIState, FormState } from '../../store';
import { i18n } from '../../lib';

const FormNavigation = ({
  currentGroup,
  formRef,
  onSubmit,
  activeGroup,
  setActiveGroup,
  totalGroup,
  showQuestionGroupList,
  setShowQuestionGroupList,
  setShowDialogMenu,
}) => {
  const visitedQuestionGroup = FormState.useState((s) => s.visitedQuestionGroup);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  useEffect(() => {
    const updateVisitedQuestionGroup = [...visitedQuestionGroup, ...[activeGroup]];
    FormState.update((s) => {
      s.visitedQuestionGroup = [...new Set(updateVisitedQuestionGroup)];
    });
  }, [activeGroup]);

  const validateOnFormNavigation = async () => {
    let errors = false;
    if (formRef?.current) {
      const touched = currentGroup?.question?.reduce(
        (res, currentQ) => ({ ...res, [currentQ?.id]: true }),
        {},
      );
      formRef.current.setTouched(touched);
      await formRef.current.validateForm();
      errors = Object.keys(formRef.current.errors)?.length > 0;
    }
    return errors;
  };

  const handleFormNavigation = (index) => {
    // index 0 = prev group
    // index 1 = show question group list
    // index 2 = next group
    if (index === 0) {
      if (!activeGroup) {
        setShowDialogMenu(true);
      } else {
        setActiveGroup(activeGroup - 1);
      }
      return;
    }
    if (index === 1) {
      setShowQuestionGroupList(!showQuestionGroupList);
      return;
    }
    validateOnFormNavigation()
      .then((errors) => {
        if (errors && Platform.OS === 'android') {
          ToastAndroid.show(trans.formMandatoryAlert, ToastAndroid.SHORT);
          return;
        }
        if (!errors && index === 2 && activeGroup === totalGroup - 1) {
          return onSubmit();
        }
        if (!errors && activeGroup <= totalGroup - 1) {
          const newValue = index === 0 ? activeGroup - 1 : activeGroup + 1;
          return setActiveGroup(newValue < 0 ? 0 : newValue);
        }
      })
      .catch((err) => console.error(err));
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
          titleStyle={styles.formNavigationTitle}
          testID="form-btn-submit"
        />
      )}
    </Tab>
  );
};

export default FormNavigation;
