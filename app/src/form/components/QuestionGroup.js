/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import Question from './Question';
import { FieldGroupHeader } from '../support';

const QuestionGroup = ({ index, group, activeQuestions, dependantQuestions }) => (
  <View style={{ paddingBottom: 48 }}>
    <FieldGroupHeader index={index} {...group} />
    <Question {...{ group, activeQuestions, index, dependantQuestions }} />
  </View>
);

export default QuestionGroup;

QuestionGroup.propTypes = {
  index: PropTypes.number.isRequired,
  group: PropTypes.object.isRequired,
  activeQuestions: PropTypes.array.isRequired,
};
