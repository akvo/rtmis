import React from 'react';
import { View } from 'react-native';
import { styles } from './styles';

const Stack = ({ children, columns = 1, row = false, reverse = false, background = '#f9fafb' }) => {
  let flexDir = row ? 'row' : 'column';
  flexDir += reverse ? '-reverse' : '';
  const itemWidth = 100 / columns + '%';
  return (
    <View
      style={{
        ...styles.container,
        flexDirection: flexDir,
        backgroundColor: background,
      }}
      testID="stack-container"
    >
      {React.Children.map(children, (child) => {
        if (child) {
          return React.cloneElement(child, {
            style: { ...child?.props?.style, width: itemWidth },
          });
        }
      })}
    </View>
  );
};

export default Stack;
