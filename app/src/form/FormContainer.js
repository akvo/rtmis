import React, { useState, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import { Dialog } from '@rneui/themed';
import PropTypes from 'prop-types';

import { BaseLayout } from '../components';
import { FormNavigation, QuestionGroupList } from './support';
import QuestionGroup from './components/QuestionGroup';
import { transformForm, generateDataPointName, onFilterDependency } from './lib';
import { FormState } from '../store';
import { i18n } from '../lib';

// TODO:: Allow other not supported yet
// TODO:: Repeat group not supported yet

const checkValuesBeforeCallback = (values) =>
  Object.keys(values)
    .map((key) => {
      let value = values[key];
      if (typeof value === 'string') {
        value = value.trim();
      }
      // check array
      if (value && Array.isArray(value)) {
        const check = value.filter((y) => typeof y !== 'undefined' && (y || Number.isNaN(y)));
        value = check.length ? check : null;
      }
      // check empty
      if (!value && value !== 0) {
        return false;
      }
      return { [key]: value };
    })
    .filter((v) => v)
    .reduce((res, current) => ({ ...res, ...current }), {});

const style = {
  flex: 1,
};

const LoadingOverlay = ({ trans }) => (
  <View
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    }}
  >
    <Dialog isVisible>
      <Dialog.Title title={`${trans.loadingPrefilledAnswer}...`} />
      <Dialog.Loading />
    </Dialog>
  </View>
);

LoadingOverlay.propTypes = {
  trans: PropTypes.objectOf(PropTypes.shape({ loadingPrefilledAnswer: PropTypes.string }))
    .isRequired,
};

const FormContainer = ({ forms, onSubmit, setShowDialogMenu, isMonitoring }) => {
  const [activeGroup, setActiveGroup] = useState(0);
  const [showQuestionGroupList, setShowQuestionGroupList] = useState(false);
  const currentValues = FormState.useState((s) => s.currentValues);
  const cascades = FormState.useState((s) => s.cascades);
  const activeLang = FormState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const formLoading = FormState.useState((s) => s.loading);

  const formDefinition = transformForm(forms, activeLang, isMonitoring);
  const activeQuestions = formDefinition?.question_group?.flatMap((qg) =>
    qg?.question?.filter((q) => onFilterDependency(qg, currentValues, q)),
  );

  const currentGroup = useMemo(
    () => formDefinition?.question_group?.[activeGroup] || {},
    [formDefinition, activeGroup],
  );
  const numberOfQuestion = currentGroup?.question?.length || 0;

  const handleOnSubmitForm = () => {
    const validValues = Object.keys(currentValues)
      .filter((qkey) => activeQuestions.map((q) => `${q.id}`).includes(qkey))
      .reduce((prev, current) => ({ [current]: currentValues[current], ...prev }), {});
    const results = checkValuesBeforeCallback(validValues);
    if (onSubmit) {
      const { dpName, dpGeo } = generateDataPointName(forms, validValues, cascades);
      onSubmit({ name: dpName, geo: dpGeo, answers: results });
    }
  };

  useEffect(() => {
    if (numberOfQuestion === 0) {
      return;
    }
    if (formLoading) {
      setTimeout(() => {
        FormState.update((s) => {
          s.loading = false;
        });
      }, numberOfQuestion);
    }
  }, [numberOfQuestion, formLoading]);

  return (
    <>
      {formLoading && <LoadingOverlay trans={trans} />}
      <BaseLayout.Content>
        <View style={style}>
          {!showQuestionGroupList ? (
            <QuestionGroup
              index={activeGroup}
              group={currentGroup}
              activeQuestions={activeQuestions}
            />
          ) : (
            <QuestionGroupList
              form={formDefinition}
              activeQuestionGroup={activeGroup}
              setActiveQuestionGroup={setActiveGroup}
              setShowQuestionGroupList={setShowQuestionGroupList}
            />
          )}
        </View>
      </BaseLayout.Content>
      <View>
        <FormNavigation
          currentGroup={currentGroup}
          onSubmit={handleOnSubmitForm}
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          totalGroup={formDefinition?.question_group?.length || 0}
          showQuestionGroupList={showQuestionGroupList}
          setShowQuestionGroupList={setShowQuestionGroupList}
          setShowDialogMenu={setShowDialogMenu}
        />
      </View>
    </>
  );
};

export default FormContainer;

FormContainer.propTypes = {
  forms: PropTypes.objectOf().isRequired,
  onSubmit: PropTypes.func.isRequired,
  setShowDialogMenu: PropTypes.func.isRequired,
  isMonitoring: PropTypes.bool.isRequired,
};
