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
import { View, Text } from 'react-native';
import { styles } from '../styles';
import { cascades } from '../../lib';
import { FormState } from '../../store';

const QuestionField = ({ keyform, field: questionField, onChange, value }) => {
  const [cascadeData, setCascadeData] = useState([]);
  const questionType = questionField?.type;
  const displayValue = questionField?.hidden ? 'none' : 'flex';
  const formFeedback = FormState.useState((s) => s.feedback);

  const handleOnChangeField = (id, val) => {
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
        return <TypeGeo keyform={keyform} value={value} {...questionField} />;
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
      {formFeedback?.[questionField?.id] && formFeedback?.[questionField?.id] !== true && (
        <Text style={styles.validationErrorText} testID="err-validation-text">
          {formFeedback[questionField.id]}
        </Text>
      )}
    </View>
  );
};

export default QuestionField;
