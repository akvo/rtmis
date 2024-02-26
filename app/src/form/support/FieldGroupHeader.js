import React from 'react';
import { View } from 'react-native';
import { Text } from '@rneui/themed';
import { styles } from '../styles';

const FieldGroupHeader = ({ description: descriptionText, index = 0, label = '' }) => {
  const hasDescription = descriptionText || null;
  return (
    <View>
      <View style={styles.fieldGroupHeader}>
        <Text style={styles.fieldGroupName} testID="text-name">
          {`${index + 1}. ${label}`}
        </Text>
      </View>
      <View style={styles.fieldGroupDescContainer}>
        {hasDescription && (
          <Text style={styles.fieldGroupDescription} testID="text-description">
            {descriptionText}
          </Text>
        )}
      </View>
    </View>
  );
};

export default FieldGroupHeader;
