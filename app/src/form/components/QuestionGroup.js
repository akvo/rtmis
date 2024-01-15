import React from 'react';
import { View } from 'react-native';
import Question from './Question';
import { FieldGroupHeader } from '../support';

const QuestionGroup = ({ index, group, setFieldValue }) => {
  return (
    <View>
      <FieldGroupHeader index={index} {...group} />
      <Question group={group} setFieldValue={setFieldValue} />
    </View>
  );
};

export default QuestionGroup;
