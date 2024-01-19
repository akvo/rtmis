import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native';

const OptionItem = ({ label, color, name }, active) => {
  return (
    <View style={[{ padding: 3 }]}>
      <View style={[{ backgroundColor: active ? '#0047AB' : color || '#FFF', padding: 15 }]}>
        <Text style={{ fontWeight: color ? 'bold' : 'normal', color: color ? 'white' : 'black' }}>
          {label || name}
        </Text>
      </View>
    </View>
  );
};

export default OptionItem;
