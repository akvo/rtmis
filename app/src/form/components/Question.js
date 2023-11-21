import React from 'react';
import { View } from 'react-native';
import QuestionField from './QuestionField';
import { styles } from '../styles';
import { modifyDependency, validateDependency, generateValidationSchemaFieldLevel } from '../lib';

const Question = ({ group, setFieldValue, values }) => {
  const fields = group?.question || [];
  return fields.map((field, keyform) => {
    if (field?.dependency) {
      const repeat = 0;
      const modifiedDependency = modifyDependency(group, field, repeat);
      const unmatches = modifiedDependency
        .map((x) => {
          return validateDependency(x, values?.[x.id]);
        })
        .filter((x) => x === false);
      if (unmatches.length) {
        // delete hidden field value
        if (values?.[field.id]) {
          delete values[field.id];
          setFieldValue(field.id, '');
        }
        return null;
      }
    }
    return (
      <View key={`question-${field.id}`} style={styles.questionContainer}>
        <QuestionField
          keyform={keyform}
          field={field}
          setFieldValue={setFieldValue}
          values={values}
          validate={(currentValue) => generateValidationSchemaFieldLevel(currentValue, field)}
        />
      </View>
    );
  });
};

export default Question;
