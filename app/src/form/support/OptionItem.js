import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native';

const OptionItem = ({ label, color, name }, active) => {
  return (
    <View style={[{ padding: 3 }]}>
      <View
        style={[
          {
            padding: 8,
            backgroundColor: color ? color : active ? '#bcbcbc' : '#FFF',
            borderRadius: color ? 5 : 0,
          },
        ]}
      >
        <Text style={{ fontWeight: color ? 'bold' : 'normal', color: color ? 'white' : 'black' }}>
          {label || name}
        </Text>
      </View>
    </View>
  );
};

export default OptionItem;
