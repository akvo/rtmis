import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { UIState } from '../store';
import { i18n } from '../lib';
import { SYNC_STATUS } from '../lib/constants';

const TIMEOUT_DISMISS = 3000; // 3second

const NetworkStatusBar = () => {
  const isOnline = UIState.useState((s) => s.online);
  const activeLang = UIState.useState((s) => s.lang);
  const statusBar = UIState.useState((s) => s.statusBar);
  const trans = i18n.text(activeLang);
  const statusBg = isOnline ? statusBar?.bgColor || '#ef4444' : '#ef4444';
  const statusIc = isOnline ? statusBar?.icon || 'cloud-offline' : 'cloud-offline';
  const statusText = {
    1: trans.syncingText,
    2: trans.reSyncingText,
    3: trans.doneText,
  };

  const handleOnResetStatusBar = useCallback(() => {
    /**
     * Check only for final result
     */
    if (statusBar?.type === SYNC_STATUS.success) {
      setTimeout(() => {
        UIState.update((s) => {
          s.statusBar = null;
        });
      }, TIMEOUT_DISMISS);
    }
  }, [statusBar]);

  useEffect(() => {
    handleOnResetStatusBar();
  }, [handleOnResetStatusBar]);

  if (!isOnline || (isOnline && statusBar !== null)) {
    return (
      <View
        style={{
          ...styles.container,
          backgroundColor: statusBg,
        }}
      >
        <Icon name={statusIc} testID="offline-icon" style={styles.icon} />
        <Text style={styles.text} testID="offline-text">
          {isOnline ? statusText?.[statusBar?.type] || trans.offlineText : trans.offlineText}
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
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
