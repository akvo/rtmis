import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';
import Titles from './Titles';

const CenterLayout = ({ children }) => (
  <View style={styles.container} testID="center-layout">
    {children}
  </View>
);

CenterLayout.Titles = Titles;

export default CenterLayout;

CenterLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
