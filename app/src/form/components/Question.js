import React, { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { FlatList, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import PropTypes from 'prop-types';
import QuestionField from './QuestionField';
import styles from '../styles';
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
      const questionList = group.question
        .filter((q) => onFilterDependency(group, values, q))
        .filter((q) => (q?.extra?.type === 'entity' && prevAdmAnswer) || !q?.extra?.type)
        .filter((q) => {
          if (q?.extra?.type === 'entity' && entityOptions?.[q?.id]?.length) {
            /**
             * Make sure the entity cascade has administration answer and options
             */
            return entityOptions[q.id].filter((opt) => prevAdmAnswer.includes(opt?.parent)).length;
          }
          return q;
        });
      const questionWithNumber = questionList.reduce((curr, q, i) => {
        if (q?.default_value && i === 0) {
          return [{ ...q, keyform: 0 }];
        }
        if (q?.default_value && i > 0) {
          return [...curr, { ...q, keyform: curr[i - 1].keyform }];
        }
        if (i === 0) {
          return [{ ...q, keyform: 1 }];
        }
        return [...curr, { ...q, keyform: curr[i - 1].keyform + 1 }];
      }, []);
      return questionWithNumber;
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

  const onDefaultValue = (id, value, type, preFilled, isLoading = true) => {
    const isMatchAnswer =
      type === 'multiple_option'
        ? preFilled.answer.some((a) => value.includes(a))
        : JSON.stringify(preFilled.answer) === JSON.stringify(value) ||
          String(preFilled.answer) === String(value);
    if (isMatchAnswer) {
      FormState.update((s) => {
        s.loading = isLoading;
      });
      const preValues = preFilled?.fill?.reduce((prev, current) => {
        /**
         * Make sure the answer criteria are not replaced by previous values
         * eg:
         * Previous value = "Update"
         * Answer criteria = "New"
         */
        const answer = id === current.id ? current.answer : values?.[current.id] || current.answer;
        return { [current.id]: answer, ...prev };
      }, {});
      FormState.update((s) => {
        s.prefilled = preValues;
      });
    }
  };

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
      onDefaultValue(id, value, field.type, preFilled);
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
  }, [currentPreFilled]);

  useEffect(() => {
    handleOnPrefilled();
  }, [handleOnPrefilled]);

  return (
    <FlatList
      ref={flatListRef}
      scrollEnabled
      data={questions}
      keyExtractor={(item) => `question-${item.id}`}
      renderItem={({ item: field }) => (
        <View key={`question-${field.id}`} style={styles.questionContainer}>
          <QuestionField
            keyform={field.keyform}
            field={field}
            onChange={handleOnChange}
            value={values?.[field.id]}
            questions={questions}
            onDefaultValue={onDefaultValue}
          />
        </View>
      )}
      extraData={group}
      removeClippedSubviews={false}
    />
  );
});

export default Question;

Question.propTypes = {
  group: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  activeQuestions: PropTypes.array,
};

Question.defaultProps = {
  activeQuestions: [],
};
