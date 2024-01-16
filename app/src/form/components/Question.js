import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import QuestionField from './QuestionField';
import { styles } from '../styles';
import { modifyDependency, validateDependency } from '../lib';
import { FormState } from '../../store';

const Question = ({ group, setFieldValue }) => {
  /**
   * TODO: handle reset FormState.feedback based on dependency
   */
  const [preload, setPreload] = useState(true);
  const values = FormState.useState((s) => s.currentValues);
  const questions = group?.question?.filter((field) => {
    if (field?.dependency) {
      const repeat = 0;
      const modifiedDependency = modifyDependency(group, field, repeat);
      const unmatches = modifiedDependency
        .map((x) => {
          return validateDependency(x, values?.[x.id]);
        })
        .filter((x) => x === false);
      if (unmatches.length) {
        return false;
      }
    }
    return field;
  });

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
          FormState.update((s) => {
            s.currentValues = { ...s.currentValues, [q.id]: UUID };
          });
        }
      });
  }, [preload, group, values]);

  const handleOnChange = (id, value, field) => {
    setFieldValue(id, value);

    const fieldValues = { ...values, [id]: value };

    const preFilled = field?.pre;
    if (preFilled?.answer) {
      const isMatchAnswer =
        JSON.stringify(preFilled?.answer) === JSON.stringify(value) ||
        String(preFilled?.answer) === String(value);
      if (isMatchAnswer) {
        FormState.update((s) => {
          s.loading = true;
        });
        preFilled?.fill?.forEach((f) => {
          setFieldValue(f?.id, f?.answer);
          fieldValues[f?.id] = f?.answer;
        });
      }
    }
    FormState.update((s) => {
      s.currentValues = fieldValues;
    });
  };

  useEffect(() => {
    handleOnGenerateUUID();
  }, [handleOnGenerateUUID]);

  return (
    <FlatList
      scrollEnabled={true}
      data={questions}
      keyExtractor={(item) => `question-${item.id}`}
      renderItem={({ item: field, index }) => {
        return (
          <View key={`question-${field.id}`} style={styles.questionContainer}>
            <QuestionField
              keyform={index}
              field={field}
              onChange={handleOnChange}
              value={values?.[field.id]}
            />
          </View>
        );
      }}
      extraData={group}
    />
  );
};

export default Question;
