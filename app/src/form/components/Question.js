import React, { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { FlatList, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import QuestionField from './QuestionField';
import { styles } from '../styles';
import { onFilterDependency } from '../lib';
import { FormState } from '../../store';

const Question = memo(({ group, activeQuestions = [], index }) => {
  /**
   * Optimizing flatlist with memo
   * https://reactnative.dev/docs/optimizing-flatlist-configuration#use-memo
   */
  const [preload, setPreload] = useState(true);
  const values = FormState.useState((s) => s.currentValues);
  const currentPreFilled = FormState.useState((s) => s.prefilled);
  const prevAdmAnswer = FormState.useState((s) => s.prevAdmAnswer);
  const entityOptions = FormState.useState((s) => s.entityOptions);
  const flatListRef = useRef(null);

  const questions = useMemo(() => {
    if (group?.question?.length) {
      return group.question
        .filter((q) => onFilterDependency(group, values, q))
        .filter((q) => {
          return (q?.extra?.type === 'entity' && prevAdmAnswer) || !q?.extra?.type;
        })
        .filter((q) => {
          if (q?.extra?.type === 'entity' && entityOptions?.[q?.id]?.length) {
            /**
             * Make sure the entity cascade has administration answer and options
             */
            return entityOptions[q.id].filter((opt) => prevAdmAnswer.includes(opt?.parent)).length;
          }
          return q;
        });
    }
    return [];
  }, [group, values, prevAdmAnswer, entityOptions]);

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
    const isEmpty = Array.isArray(value) ? value.length === 0 : String(value)?.trim()?.length === 0;

    if (!isEmpty) {
      FormState.update((s) => {
        s.feedback = { ...s.feedback, [id]: true };
      });
    }

    const preFilled = field?.pre;
    if (preFilled?.answer) {
      const isMatchAnswer =
        JSON.stringify(preFilled?.answer) === JSON.stringify(value) ||
        String(preFilled?.answer) === String(value);
      if (isMatchAnswer) {
        FormState.update((s) => {
          s.loading = true;
        });
        FormState.update((s) => {
          const preValues = preFilled?.fill?.reduce((prev, current) => {
            return { [current['id']]: current['answer'], ...prev };
          }, {});
          s.prefilled = preValues;
        });
      }
    }

    if (field?.source?.file === 'administrator.sqlite') {
      activeQuestions
        ?.filter((q) => q?.source?.cascade_parent)
        ?.forEach((q) => {
          /**
           * Delete entity cascade response when the administration changes
           */
          delete fieldValues[q?.id];
        });
    }
    FormState.update((s) => {
      s.currentValues = fieldValues;
    });
  };

  useEffect(() => {
    handleOnGenerateUUID();
  }, [handleOnGenerateUUID]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
    }
  }, [index]);

  const handleOnPrefilled = useCallback(() => {
    /**
     * Prefilled
     */
    if (currentPreFilled) {
      FormState.update((s) => {
        const activeValues = {
          ...s.currentValues,
          ...currentPreFilled,
        };
        s.currentValues = activeValues;
        s.prefilled = false;
      });
    }
  }, [currentPreFilled, questions]);

  useEffect(() => {
    handleOnPrefilled();
  }, [handleOnPrefilled]);

  return (
    <FlatList
      ref={flatListRef}
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
      removeClippedSubviews={false}
    />
  );
});

export default Question;
