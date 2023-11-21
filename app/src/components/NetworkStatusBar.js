import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { UIState } from '../store';
import { i18n } from '../lib';

const NetworkStatusBar = () => {
  const { online: isOnline, lang: activeLang } = UIState.useState((s) => s);
  const trans = i18n.text(activeLang);

  return isOnline ? null : (
    <View style={styles.container}>
      <Icon name="cloud-offline" testID="offline-icon" style={styles.icon} />
      <Text style={styles.text} testID="offline-text">
        {trans.offlineText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 4,
    paddingVertical: 10,
    display: 'flex',
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 14, color: '#f5f5f5' },
  icon: {
    fontSize: 14,
    color: '#f5f5f5',
  },
});

export default NetworkStatusBar;
