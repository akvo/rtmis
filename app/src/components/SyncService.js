import { useCallback, useEffect } from 'react';
import { BuildParamsState, UIState } from '../store';
import { backgroundTask } from '../lib';
/**
 * This sync only works in the foreground service
 */
const SyncService = () => {
  const isOnline = UIState.useState((s) => s.online);
  const syncInterval = BuildParamsState.useState((s) => s.dataSyncInterval);
  const syncInSecond = parseInt(syncInterval) * 1000;

  const onSync = useCallback(async () => {
    await backgroundTask.syncFormSubmission();
  }, []);

  useEffect(() => {
    if (!syncInSecond || !isOnline) {
      return;
    }

    const syncTimer = setInterval(() => {
      // Perform sync operation
      onSync();
    }, syncInSecond);

    return () => {
      // Clear the interval when the component unmounts
      clearInterval(syncTimer);
    };
  }, [syncInSecond, isOnline, onSync]);

  return null; // This is a service component, no rendering is needed
};

export default SyncService;
