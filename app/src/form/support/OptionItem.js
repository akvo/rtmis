import React from 'react';
import { View , Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const OptionItem = ({ label, color, name }, active) => (
    <View style={[{ padding: 3 }]}>
      <View
        style={[
          {
            padding: 8,
            backgroundColor: color || (active ? '#bcbcbc' : 'white'),
            borderRadius: color ? 5 : 0,
          },
        ]}
      >
        <Text
          style={{
            color: color || active ? 'white' : 'black',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {active && <Icon name="check" size={20} color="#000" />} {label || name}
        </Text>
      </View>
    </View>
  );

export default OptionItem;
