import { crudForms, crudDataPoints, crudUsers, crudConfig } from '../database/crud';
import api from './api';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Network from 'expo-network';
import notification from './notification';
import crudJobs, { jobStatus, MAX_ATTEMPT } from '../database/crud/crud-jobs';
import { UIState } from '../store';

export const syncStatus = {
  ON_PROGRESS: 1,
  RE_SYNC: 2,
  SUCCESS: 3,
  FAILED: 4,
};

const syncFormVersion = async ({
  showNotificationOnly = true,
  sendPushNotification = () => {},
}) => {
  const { isConnected } = await Network.getNetworkStateAsync();
  if (!isConnected) {
    return;
  }
  try {
    // find last session
    const session = await crudUsers.getActiveUser();
    if (!session) {
      return;
    }
    api.post('/auth', { code: session.password }).then(async (res) => {
      const { data } = res;
      const promises = data.formsUrl.map(async (form) => {
        const formExist = await crudForms.selectFormByIdAndVersion({ ...form });
        if (formExist) {
          return false;
        }
        if (showNotificationOnly) {
          console.info('[bgTask]New form:', form.id, form.version);
          return { id: form.id, version: form.version };
        }
        const formRes = await api.get(form.url);
        // update previous form latest value to 0
        await crudForms.updateForm({ ...form });
        console.info('[syncForm]Updated Forms...', form.id);
        const savedForm = await crudForms.addForm({
          ...form,
          userId: session?.id,
          formJSON: formRes?.data,
        });
        console.info('[syncForm]Saved Forms...', form.id);
        return savedForm;
      });
      Promise.all(promises).then((res) => {
        const exist = res.filter((x) => x);
        if (!exist.length || !showNotificationOnly) {
          return;
        }
        sendPushNotification();
      });
    });
  } catch (err) {
    console.error('[bgTask]sycnFormVersion failed:', err);
  }
};

const registerBackgroundTask = async (TASK_NAME, settingsValue = null) => {
  try {
    const config = await crudConfig.getConfig();
    const syncInterval = settingsValue || parseInt(config?.syncInterval) || 3600;
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: syncInterval,
      stopOnTerminate: false, // android only,
      startOnBoot: true, // android only
    });
  } catch (err) {
    console.error('Task Register failed:', err);
  }
};

const unregisterBackgroundTask = async (TASK_NAME) => {
  try {
    await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
  } catch (err) {
    console.error('Task Unregister failed:', err);
  }
};

const backgroundTaskStatus = async (TASK_NAME) => {
  const status = await BackgroundFetch.getStatusAsync();
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  console.info(`[${TASK_NAME}] Status`, status, isRegistered);
};

const handleOnUploadPhotos = async (data) => {
  const AllPhotos = data?.flatMap((d) => {
    const answers = JSON.parse(d.json);
    const questions = JSON.parse(d.json_form)?.question_group?.flatMap((qg) => qg.question) || [];
    const photos = questions
      .filter((q) => q.type === 'photo')
      .map((q) => ({ id: q.id, value: answers?.[q.id], dataID: d.id }))
      .filter((p) => p.value);
    return photos;
  });

  if (AllPhotos?.length) {
    const uploads = AllPhotos.map((p) => {
      const fileType = p.value.split('.').slice(-1)?.[0];
      const formData = new FormData();
      formData.append('file', {
        uri: p.value,
        name: `photo_${p.id}_${p.dataID}.${fileType}`,
        type: `image/${fileType}`,
      });
      return api.post('/images', formData, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });
    });

    const responses = await Promise.allSettled(uploads);
    const results = responses
      .filter(({ status }) => status === 'fulfilled')
      .map(({ value: resValue }) => {
        const { data: fileData } = resValue;
        const findPhoto =
          AllPhotos.find((ap) => fileData?.file?.includes(`${ap.id}_${ap.dataID}`)) || {};
        return {
          ...fileData,
          ...findPhoto,
        };
      })
      .filter((d) => d);
    return results;
  } else {
    return [];
  }
};

const syncFormSubmission = async (activeJob = {}) => {
  const { isConnected } = await Network.getNetworkStateAsync();
  if (!isConnected) {
    return;
  }
  try {
    let sendNotification = false;
    console.info('[syncFormSubmision] SyncData started => ', new Date());
    // get token
    const session = await crudUsers.getActiveUser();
    // set token
    api.setToken(session.token);
    // get all datapoints to sync
    const data = await crudDataPoints.selectSubmissionToSync();
    /**
     * Upload all photo of questions first
     */
    const photos = await handleOnUploadPhotos(data);
    console.info('[syncFormSubmision] data point to sync:', data.length);
    const syncProcess = data.map(async (d) => {
      const geo = d.geo ? d.geo.split('|')?.map((x) => parseFloat(x)) : [];

      const answerValues = JSON.parse(d.json.replace(/''/g, "'"));
      photos
        ?.filter((pt) => pt?.dataID === d.id)
        ?.forEach((pt) => {
          answerValues[pt?.id] = pt?.file;
        });
      const syncData = {
        formId: d.formId,
        name: d.name,
        duration: Math.round(d.duration),
        submittedAt: d.submittedAt,
        submitter: session.name,
        geo,
        answers: answerValues,
      };
      console.info('[syncFormSubmision] SyncData:', syncData);
      // sync data point
      const res = await api.post('/sync', syncData);
      console.info('[syncFormSubmision] post sync data point:', res.status);
      if (res.status === 200) {
        // update data point
        await crudDataPoints.updateDataPoint({
          ...d,
          syncedAt: new Date().toISOString(),
        });
        sendNotification = true;
        console.info('[syncFormSubmision] updated data point syncedAt:', d.id);
      }
      return {
        datapoint: d.id,
        status: res.status,
      };
    });
    const res = await Promise.all(syncProcess);
    console.info('[syncFormSubmision] Finish: ', new Date());

    UIState.update((s) => {
      // TODO: rename isManualSynced w/ isSynced to refresh the Homepage stats
      s.isManualSynced = true;
      s.statusBar = {
        type: syncStatus.SUCCESS,
        bgColor: '#16a34a',
        icon: 'checkmark-done',
      };
    });

    if (sendNotification) {
      notification.sendPushNotification('sync-form-submission');
    }
    sendNotification = false;
    if (activeJob?.id) {
      // delete the job when it's succeed
      await crudJobs.deleteJob(activeJob.id);
    }
    return res;
  } catch (err) {
    if (activeJob?.id) {
      const updatePayload =
        activeJob.attempt < MAX_ATTEMPT
          ? { status: jobStatus.FAILED, attempt: activeJob.attempt + 1 }
          : { status: jobStatus.FAILED, active: 0, info: String(err) };
      crudJobs.updateJob(activeJob.id, updatePayload);

      const statusBar =
        activeJob.attempt < MAX_ATTEMPT
          ? { type: syncStatus.RE_SYNC, bgColor: '#d97706', icon: 'repeat' }
          : { type: syncStatus.FAILED, bgColor: '#dc2626', icon: 'alert' };
      UIState.update((s) => {
        s.statusBar = statusBar;
      });
    }
    console.error('[syncFormSubmission] Error: ', err);
  }
};

const backgroundTaskHandler = () => {
  return {
    syncFormVersion,
    registerBackgroundTask,
    unregisterBackgroundTask,
    backgroundTaskStatus,
    syncFormSubmission,
  };
};

const backgroundTask = backgroundTaskHandler();

export const SYNC_FORM_VERSION_TASK_NAME = 'sync-form-version';

export const SYNC_FORM_SUBMISSION_TASK_NAME = 'sync-form-submission';

export const defineSyncFormVersionTask = () =>
  TaskManager.defineTask(SYNC_FORM_VERSION_TASK_NAME, async () => {
    try {
      await syncFormVersion({
        sendPushNotification: notification.sendPushNotification,
        showNotificationOnly: true,
      });
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (err) {
      console.error(`[${SYNC_FORM_VERSION_TASK_NAME}] Define task manager failed`, err);
      return BackgroundFetch.Result.Failed;
    }
  });

export const defineSyncFormSubmissionTask = () => {
  TaskManager.defineTask(SYNC_FORM_SUBMISSION_TASK_NAME, async () => {
    try {
      await syncFormSubmission();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (err) {
      console.error(`[${SYNC_FORM_SUBMISSION_TASK_NAME}] Define task manager failed`, err);
      return BackgroundFetch.Result.Failed;
    }
  });
};

export default backgroundTask;
