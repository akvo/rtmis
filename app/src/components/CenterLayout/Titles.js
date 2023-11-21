import React from 'react';
import { View } from 'react-native';
import { Text } from '@rneui/themed';
import { styles } from './styles';

export const Titles = ({ items = [] }) => {
  return (
    <View style={styles.heading} testID="center-layout-items">
      {items?.map((item, ix) => (
        <Text key={ix} h4>
          {item}
        </Text>
      ))}
    </View>
  );
};
