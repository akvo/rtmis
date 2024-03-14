import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';

const Stack = ({ children, columns = 1, row = false, reverse = false, background = '#f9fafb' }) => {
  let flexDir = row ? 'row' : 'column';
  flexDir += reverse ? '-reverse' : '';
  const itemWidth = `${100 / columns}%`;
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
        return null;
      })}
    </View>
  );
};

export default Stack;

Stack.propTypes = {
  children: PropTypes.node,
  columns: PropTypes.number,
  reverse: PropTypes.bool,
  row: PropTypes.bool,
  background: PropTypes.string,
};

Stack.defaultProps = {
  children: null,
  columns: 1,
  row: false,
  reverse: false,
  background: '#f9fafb',
};
