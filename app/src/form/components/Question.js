import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import QuestionField from './QuestionField';
import { styles } from '../styles';
import { onFilterDependency } from '../lib';
import { FormState } from '../../store';

const Question = ({ group }) => {
  const [preload, setPreload] = useState(true);
  const values = FormState.useState((s) => s.currentValues);
  const questions = group?.question?.filter((q) => onFilterDependency(group, values, q));

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
        if (!values?.[q.id]) {
          const UUID = Crypto.randomUUID();
          FormState.update((s) => {
            s.currentValues = { ...s.currentValues, [q.id]: UUID };
          });
        }
      });
  }, [preload, group, values]);

  const handleOnChange = (id, value, field) => {
    const fieldValues = { ...values, [id]: value };

    const preFilled = field?.pre;
    if (preFilled?.answer) {
      const isMatchAnswer =
        JSON.stringify(preFilled?.answer) === JSON.stringify(value) ||
        String(preFilled?.answer) === String(value);
      if (isMatchAnswer) {
        preFilled?.fill?.forEach((f) => {
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
