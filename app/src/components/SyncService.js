import { useCallback, useEffect } from 'react';
import { BuildParamsState, DatapointSyncState, UIState } from '../store';
import { backgroundTask } from '../lib';
import crudJobs, {
  jobStatus,
  MAX_ATTEMPT,
  SYNC_DATAPOINT_JOB_NAME,
} from '../database/crud/crud-jobs';
import { SYNC_FORM_SUBMISSION_TASK_NAME, syncStatus } from '../lib/background-task';
import { crudDataPoints } from '../database/crud';
import { downloadDatapointsJson, fetchDatapoints } from '../lib/sync-datapoints';
/**
 * This sync only works in the foreground service
 */
const SyncService = () => {
  const isOnline = UIState.useState((s) => s.online);
  const syncInterval = BuildParamsState.useState((s) => s.dataSyncInterval);
  const syncInSecond = parseInt(syncInterval) * 1000;
  const statusBar = UIState.useState((s) => s.statusBar);

  const onSync = useCallback(async () => {
    const pendingToSync = await crudDataPoints.selectSubmissionToSync();
    const activeJob = await crudJobs.getActiveJob(SYNC_FORM_SUBMISSION_TASK_NAME);

    console.info('[ACTIVE JOB]', activeJob);

    if (activeJob?.status === jobStatus.ON_PROGRESS) {
      if (activeJob.attempt < MAX_ATTEMPT) {
        /**
         * Job is still in progress,
         * but we still have pending items; then increase the attempt value.
         */
        await crudJobs.updateJob(activeJob.id, {
          attempt: activeJob.attempt + 1,
        });
      }

      if (activeJob.attempt === MAX_ATTEMPT) {
        /**
         * If the status is still IN PROGRESS and has reached the maximum attempts,
         * set it to PENDING when there are still pending sync items,
         * delete the job when it's finish and there are no pending items.
         */
        if (pendingToSync) {
          UIState.update((s) => {
            s.statusBar = {
              type: syncStatus.RE_SYNC,
              bgColor: '#d97706',
              icon: 'repeat',
            };
          });
          await crudJobs.updateJob(activeJob.id, {
            status: jobStatus.PENDING,
            attempt: 0, // RESET attempt to 0
          });
        } else {
          UIState.update((s) => {
            s.statusBar = {
              type: syncStatus.SUCCESS,
              bgColor: '#16a34a',
              icon: 'checkmark-done',
            };
          });
          await crudJobs.deleteJob(activeJob.id);
        }
      }
    }

    if (
      activeJob?.status === jobStatus.PENDING ||
      (activeJob?.status === jobStatus.FAILED && activeJob?.attempt <= MAX_ATTEMPT)
    ) {
      UIState.update((s) => {
        s.statusBar = {
          type: syncStatus.ON_PROGRESS,
          bgColor: '#2563eb',
          icon: 'sync',
        };
      });
      await crudJobs.updateJob(activeJob.id, {
        status: jobStatus.ON_PROGRESS,
      });
      await backgroundTask.syncFormSubmission(activeJob);
    }
  }, [statusBar]);

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

  const onSyncDataPoint = useCallback(async () => {
    const activeJob = await crudJobs.getActiveJob(SYNC_DATAPOINT_JOB_NAME);

    DatapointSyncState.update((s) => {
      s.added = false;
      s.inProgress = activeJob ? true : false;
    });

    if (activeJob && activeJob.status === jobStatus.PENDING && activeJob.attempt < MAX_ATTEMPT) {
      await crudJobs.updateJob(activeJob.id, {
        status: jobStatus.ON_PROGRESS,
      });

      try {
        const allData = await fetchDatapoints();
        const urls = allData.map(({ url, form_id: formId }) => ({ url, formId }));
        await Promise.all(urls.map(({ formId, url }) => downloadDatapointsJson(formId, url)));
        await crudJobs.deleteJob(activeJob.id);

        DatapointSyncState.update((s) => {
          s.inProgress = false;
        });
      } catch (error) {
        DatapointSyncState.update((s) => {
          s.added = true;
        });
        await crudJobs.updateJob(activeJob.id, {
          status: jobStatus.PENDING,
          attempt: activeJob.attempt + 1,
          info: String(error),
        });
      }
    }

    if (activeJob && activeJob.status === jobStatus.PENDING && activeJob.attempt === MAX_ATTEMPT) {
      await crudJobs.deleteJob(activeJob.id);
    }
  }, []);

  useEffect(() => {
    const unsubsDataSync = DatapointSyncState.subscribe(
      (s) => s.added,
      (added) => {
        if (added) {
          onSyncDataPoint();
        }
      },
    );

    return () => {
      unsubsDataSync();
    };
  }, [onSyncDataPoint]);

  return null; // This is a service component, no rendering is needed
};

export default SyncService;
