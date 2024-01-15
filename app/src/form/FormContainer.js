import React, { useState, useRef, useMemo, useEffect } from 'react';
import { BaseLayout } from '../components';
import { ScrollView, View, FlatList } from 'react-native';
import { Formik } from 'formik';
import { styles } from './styles';
import { FormNavigation, QuestionGroupList } from './support';
import QuestionGroup from './components/QuestionGroup';
import { transformForm, generateDataPointName } from './lib';
import { FormState } from '../store';
import { Dialog } from '@rneui/themed';
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
        const check = value.filter((y) => typeof y !== 'undefined' && (y || isNaN(y)));
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

const FormContainer = ({ forms, initialValues = {}, onSubmit, onSave, setShowDialogMenu }) => {
  const formRef = useRef();
  const [activeGroup, setActiveGroup] = useState(0);
  const [showQuestionGroupList, setShowQuestionGroupList] = useState(false);
  const currentValues = FormState.useState((s) => s.currentValues);
  const questionGroupListCurrentValues = FormState.useState(
    (s) => s.questionGroupListCurrentValues,
  );
  const cascades = FormState.useState((s) => s.cascades);
  const activeLang = FormState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const formLoading = FormState.useState((s) => s.loading);

  useEffect(() => {
    if (onSave) {
      const results = checkValuesBeforeCallback(currentValues);
      if (!Object.keys(results).length) {
        return onSave(null);
      }
      const { dpName, dpGeo } = generateDataPointName(forms, currentValues, cascades);
      const values = { name: dpName, geo: dpGeo, answers: results };
      return onSave(values);
    }
  }, [currentValues, onSave]);

  const formDefinition = useMemo(() => {
    const transformedForm = transformForm(forms, activeLang);
    FormState.update((s) => {
      s.visitedQuestionGroup = [transformedForm.question_group[0].id];
    });
    return transformedForm;
  }, [forms, activeLang]);
  const numberOfQuestion =
    formDefinition?.question_group?.flatMap((qg) => qg?.question)?.length || 0;

  const currentGroup = useMemo(() => {
    return formDefinition.question_group.find((qg) => qg.id === activeGroup);
  }, [formDefinition, activeGroup]);

  const handleOnSubmitForm = (values) => {
    const results = checkValuesBeforeCallback(values);
    if (onSubmit) {
      const { dpName, dpGeo } = generateDataPointName(forms, currentValues, cascades);
      onSubmit({ name: dpName, geo: dpGeo, answers: results });
    }
  };

  useEffect(() => {
    if (numberOfQuestion === 0) {
      return;
    }
    if (formLoading) {
      /**
       Based on Formik's behavior, each onChange will trigger a rerender for each field.
       Therefore, we can use the number of questions as a timeout.
       */
      setTimeout(() => {
        FormState.update((s) => {
          s.loading = false;
        });
      }, numberOfQuestion);
    }
  }, [numberOfQuestion, formLoading]);

  if (formLoading) {
    return (
      <Dialog isVisible>
        <Dialog.Title title={`${trans.loadingPrefilledAnswer}...`} />
        <Dialog.Loading />
      </Dialog>
    );
  }

  return (
    <>
      <BaseLayout.Content>
        <View style={style}>
          {!showQuestionGroupList ? (
            <Formik
              innerRef={formRef}
              initialValues={initialValues}
              onSubmit={handleOnSubmitForm}
              validateOnBlur={true}
              validateOnChange={true}
            >
              {({ setFieldValue, values }) => (
                <FlatList
                  scrollEnabled={true}
                  data={formDefinition?.question_group}
                  keyExtractor={(item) => `group-${item.id}`}
                  renderItem={({ item: group }) => {
                    if (activeGroup !== group.id) {
                      return '';
                    }
                    return (
                      <QuestionGroup
                        key={`group-${group.id}`}
                        index={group.id}
                        group={group}
                        setFieldValue={setFieldValue}
                        values={values}
                      />
                    );
                  }}
                  extraData={activeGroup}
                />
              )}
            </Formik>
          ) : (
            <QuestionGroupList
              form={formDefinition}
              values={questionGroupListCurrentValues}
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
          formRef={formRef}
          onSubmit={() => {
            if (formRef.current) {
              formRef.current.handleSubmit();
            }
          }}
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
