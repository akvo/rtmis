import React from 'react';
import { View } from 'react-native';
import Question from './Question';
import { FieldGroupHeader } from '../support';

const QuestionGroup = ({ index, group, activeQuestions }) => {
  return (
    <View style={{ paddingBottom: 48 }}>
      <FieldGroupHeader index={index} {...group} />
      <Question {...{ group, activeQuestions, index }} />
    </View>
  );
};

export default QuestionGroup;
