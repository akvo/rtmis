import React, { useCallback, useEffect, useState } from 'react';
import {
  TypeDate,
  TypeImage,
  TypeInput,
  TypeMultipleOption,
  TypeOption,
  TypeText,
  TypeNumber,
  TypeGeo,
  TypeCascade,
  TypeAutofield,
} from '../fields';
import { useField } from 'formik';
import { View, Text } from 'react-native';
import { styles } from '../styles';
import { FormState } from '../../store';
import { cascades } from '../../lib';

const QuestionField = ({ keyform, field: questionField, setFieldValue, values, validate }) => {
  const [field, meta, helpers] = useField({ name: questionField.id, validate });
  const [cascadeData, setCascadeData] = useState([]);
  const [preload, setPreload] = useState(true);
  const preFilled = questionField?.pre;
  const questionID = questionField?.id;
  const displayValue = questionField?.hidden ? 'none' : 'flex';

  useEffect(() => {
    if (meta.error && field.name) {
      FormState.update((s) => {
        const removedErrorValues = Object.keys(s.questionGroupListCurrentValues)
          .filter((key) => key.toString() !== field.name.toString())
          .reduce((acc, curr) => ({ ...acc, [curr]: s.questionGroupListCurrentValues[curr] }), {});
        s.questionGroupListCurrentValues = removedErrorValues;
      });
    } else {
      FormState.update((s) => {
        s.questionGroupListCurrentValues = { ...s.questionGroupListCurrentValues, ...values };
      });
    }
  }, [meta.error, field.name, values]);

  const handleOnChangeField = (id, value) => {
    helpers.setTouched({ [field.name]: true });
    setFieldValue(id, value);
    FormState.update((s) => {
      s.currentValues = { ...s.currentValues, [id]: value };
    });
  };

  const loadCascadeDataSource = async (source) => {
    const { rows } = await cascades.loadDataSource(source);
    setCascadeData(rows._array);
  };

  const handleOnPrefilled = useCallback(() => {
    if (preload && preFilled?.fill?.length && questionID) {
      setPreload(false);
      const findFill = preFilled.fill.find((f) => f?.id === questionID);
      if (findFill) {
        setFieldValue(questionID, findFill.answer);
        FormState.update((s) => {
          s.currentValues = { ...s.currentValues, [questionID]: findFill.answer };
        });
      }
    }
  }, [preload, preFilled, questionID]);

  useEffect(() => {
    if (questionField?.type === 'cascade' && questionField?.source?.file) {
      const cascadeSource = questionField.source;
      loadCascadeDataSource(cascadeSource);
    }
  }, []);

  useEffect(() => {
    handleOnPrefilled();
  }, [handleOnPrefilled]);

  const renderField = () => {
    switch (questionField?.type) {
      case 'date':
        return (
          <TypeDate
            keyform={keyform}
            onChange={handleOnChangeField}
            values={values}
            {...questionField}
          />
        );
      case 'photo':
        return (
          <TypeImage
            keyform={keyform}
            onChange={handleOnChangeField}
            values={values}
            {...questionField}
          />
        );
      case 'multiple_option':
        return (
          <TypeMultipleOption
            keyform={keyform}
            onChange={handleOnChangeField}
            values={values}
            {...questionField}
          />
        );
      case 'option':
        return (
          <TypeOption
            keyform={keyform}
            onChange={handleOnChangeField}
            values={values}
            {...questionField}
          />
        );
      case 'text':
        return (
          <TypeText
            keyform={keyform}
            onChange={handleOnChangeField}
            values={values}
            {...questionField}
          />
        );
      case 'number':
        return (
          <TypeNumber
            keyform={keyform}
            onChange={handleOnChangeField}
            values={values}
            {...questionField}
          />
        );
      case 'geo':
        return (
          <TypeGeo
            keyform={keyform}
            onChange={handleOnChangeField}
            values={values}
            {...questionField}
          />
        );
      case 'cascade':
        return (
          <TypeCascade
            keyform={keyform}
            onChange={handleOnChangeField}
            values={values}
            {...questionField}
            dataSource={cascadeData}
          />
        );
      case 'autofield':
        return (
          <TypeAutofield
            keyform={keyform}
            onChange={handleOnChangeField}
            values={values}
            {...questionField}
          />
        );
      default:
        return (
          <TypeInput
            keyform={keyform}
            onChange={handleOnChangeField}
            values={values}
            {...questionField}
          />
        );
    }
  };

  return (
    <View testID="question-view" style={{ display: displayValue }}>
      {renderField()}
      {meta.touched && meta.error ? (
        <Text style={styles.validationErrorText} testID="err-validation-text">
          {meta.error}
        </Text>
      ) : null}
    </View>
  );
};

export default QuestionField;
