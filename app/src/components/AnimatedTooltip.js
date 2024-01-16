import React from 'react';
import { View, StyleSheet } from 'react-native';
import RenderHtml from 'react-native-render-html';

const AnimatedTooltip = ({ visible, content }) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: 10 }}>
      <View style={styles.arrow} />
      <View style={[styles.tooltipContainer]}>
        <RenderHtml source={{ html: content }} contentWidth={100} baseStyle={styles.htmlContent} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'grey',
    marginLeft: 10,
  },
  tooltipContainer: {
    padding: 10,
    backgroundColor: 'grey',
    borderRadius: 5,
    shadowOpacity: 0.3,
    marginTop: -1,
  },
  htmlContent: {
    color: 'white',
  },
});

export default AnimatedTooltip;
