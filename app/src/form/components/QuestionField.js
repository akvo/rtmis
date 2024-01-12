import React, { useCallback, useEffect, useState, memo } from 'react';
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

const QuestionField = memo(({ keyform, field: questionField, setFieldValue, values, validate }) => {
  const [field, meta, helpers] = useField({ name: questionField.id, validate });
  const [cascadeData, setCascadeData] = useState([]);
  const preFilled = questionField?.pre;
  const questionType = questionField?.type;
  const displayOnly = questionField?.displayOnly;
  const displayValue = questionField?.hidden ? 'none' : 'flex';

  const handleOnChangeField = useCallback(
    (id, value) => {
      if (displayOnly) {
        return;
      }
      helpers.setTouched({ [field.name]: true });
      setFieldValue(id, value);
      const fieldValues = { ...values, [id]: value };
      if (preFilled?.answer) {
        const isMatchAnswer =
          JSON.stringify(preFilled?.answer) === JSON.stringify(value) ||
          String(preFilled?.answer) === String(value);
        if (isMatchAnswer) {
          preFilled?.fill?.forEach((f) => {
            setFieldValue(f?.id, f?.answer);
            fieldValues[f?.id] = f?.answer;
          });
        }
      }
      FormState.update((s) => {
        s.currentValues = fieldValues;
      });
    },
    [setFieldValue, displayOnly, preFilled, field.name, values],
  );

  const loadCascadeDataSource = useCallback(async (source) => {
    const { rows } = await cascades.loadDataSource(source);
    setCascadeData(rows._array);
  }, []);

  useEffect(() => {
    if (questionField?.type === 'cascade' && questionField?.source?.file) {
      const cascadeSource = questionField.source;
      loadCascadeDataSource(cascadeSource);
    }
  }, []);

  const renderField = useCallback(() => {
    switch (questionType) {
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
  }, [questionField, keyform, handleOnChangeField, values, cascadeData]);

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
});

export default QuestionField;
