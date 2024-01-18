import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native';

const OptionItem = ({ label, color, name }, active) => {
  return (
    <View style={[{ padding: 15 }]}>
      <Text>
        {color ? <Text style={[{ color: color }]}>●</Text> : null} {label || name}
      </Text>
    </View>
  );
};

export default OptionItem;
