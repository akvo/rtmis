import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { styles } from '../styles';

const QuestionGroupListItem = ({ label, active, completedQuestionGroup = false, onPress }) => {
  const icon = completedQuestionGroup ? 'check-circle' : 'circle';
  const bgColor = completedQuestionGroup ? '#2884bd' : '#d4d4d4';
  const activeOpacity = active ? styles.questionGroupListItemActive : {};
  const activeName = active ? styles.questionGroupListItemNameActive : {};
  return (
    <TouchableOpacity
      style={{ ...styles.questionGroupListItemWrapper, ...activeOpacity }}
      testID="question-group-list-item-wrapper"
      disabled={!completedQuestionGroup}
      onPress={onPress}
    >
      <Icon
        testID="icon-mark"
        name="circle"
        type="font-awesome"
        color={bgColor}
        style={styles.questionGroupListItemIcon}
      />
      <Text style={{ ...styles.questionGroupListItemName, ...activeName }}>{label}</Text>
    </TouchableOpacity>
  );
};

export default QuestionGroupListItem;
