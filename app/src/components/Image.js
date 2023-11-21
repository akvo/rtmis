import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image as RneImage } from '@rneui/themed';

const Image = ({ src = null, style = {} }) => {
  return src ? (
    <RneImage
      source={{ uri: src }}
      containerStyle={{ ...styles.image, ...style }}
      testID="image-component"
    />
  ) : (
    <View style={styles.image} testID="image-skeleton" />
  );
};

const styles = StyleSheet.create({
  image: { width: 110, height: 110, backgroundColor: '#e5e7eb', borderRadius: 4 },
});

export default Image;
