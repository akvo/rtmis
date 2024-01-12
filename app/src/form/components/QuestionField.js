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
import { cascades } from '../../lib';

const QuestionField = memo(({ keyform, field: questionField, onChange, value, validate }) => {
  const [_, meta, helpers] = useField({ name: questionField.id, validate });
  const [cascadeData, setCascadeData] = useState([]);
  const questionType = questionField?.type;
  const displayValue = questionField?.hidden ? 'none' : 'flex';

  const handleOnChangeField = (id, val) => {
    helpers.setTouched({ [questionField?.id]: true });
    if (questionField?.displayOnly) {
      return;
    }
    onChange(id, val, questionField);
  };

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
            value={value}
            {...questionField}
          />
        );
      case 'photo':
        return (
          <TypeImage
            keyform={keyform}
            onChange={handleOnChangeField}
            value={value}
            {...questionField}
          />
        );
      case 'multiple_option':
        return (
          <TypeMultipleOption
            keyform={keyform}
            onChange={handleOnChangeField}
            value={value}
            {...questionField}
          />
        );
      case 'option':
        return (
          <TypeOption
            keyform={keyform}
            onChange={handleOnChangeField}
            value={value}
            {...questionField}
          />
        );
      case 'text':
        return (
          <TypeText
            keyform={keyform}
            onChange={handleOnChangeField}
            value={value}
            {...questionField}
          />
        );
      case 'number':
        return (
          <TypeNumber
            keyform={keyform}
            onChange={handleOnChangeField}
            value={value}
            {...questionField}
          />
        );
      case 'geo':
        return <TypeGeo keyform={keyform} onChange={handleOnChangeField} {...questionField} />;
      case 'cascade':
        return (
          <TypeCascade
            keyform={keyform}
            onChange={handleOnChangeField}
            value={value}
            {...questionField}
            dataSource={cascadeData}
          />
        );
      case 'autofield':
        return (
          <TypeAutofield keyform={keyform} onChange={handleOnChangeField} {...questionField} />
        );
      default:
        return (
          <TypeInput
            keyform={keyform}
            onChange={handleOnChangeField}
            value={value}
            {...questionField}
          />
        );
    }
  }, [questionField, keyform, handleOnChangeField, value, cascadeData]);

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
