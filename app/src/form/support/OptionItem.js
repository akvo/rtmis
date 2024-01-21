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
            backgroundColor: active ? '#0047AB' : color || '#FFF',
            borderRadius: color ? 5 : 0,
          },
        ]}
      >
        <Text
          style={{
            color: color || active ? 'white' : 'black',
          }}
        >
          {label || name}
        </Text>
      </View>
    </View>
  );
};

export default OptionItem;
