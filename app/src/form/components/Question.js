import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Crypto from 'expo-crypto';
import QuestionField from './QuestionField';
import { styles } from '../styles';
import { modifyDependency, validateDependency, generateValidationSchemaFieldLevel } from '../lib';

const Question = ({ group, setFieldValue, values }) => {
  const [preload, setPreload] = useState(true);

  const handleOnGenerateUUID = useCallback(() => {
    if (preload) {
      setPreload(false);
    }
    if (!preload) {
      return;
    }
    group?.question
      ?.filter((q) => q?.meta_uuid)
      ?.forEach((q) => {
        if (!values?.[q.id] && typeof setFieldValue === 'function') {
          const UUID = Crypto.randomUUID();
          setFieldValue(q.id, UUID);
        }
      });
  }, [preload, group, values]);

  useEffect(() => {
    handleOnGenerateUUID();
  }, [handleOnGenerateUUID]);

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
          // setFieldValue(field.id, '');
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
