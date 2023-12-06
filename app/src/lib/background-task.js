import { crudForms, crudDataPoints, crudUsers } from '../database/crud';
import api from './api';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import notification from './notification';

const syncFormVersion = async ({
  showNotificationOnly = true,
  sendPushNotification = () => {},
}) => {
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
        const savedForm = await crudForms.addForm({ ...form, formJSON: formRes?.data });
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

const registerBackgroundTask = async (TASK_NAME, minimumInterval = 86400) => {
  try {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: minimumInterval,
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

const backgroundTaskStatus = async (TASK_NAME, minimumInterval = 86400) => {
  const status = await BackgroundFetch.getStatusAsync();
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (BackgroundFetch.BackgroundFetchStatus?.[status] === 'Available' && !isRegistered) {
    await registerBackgroundTask(TASK_NAME, minimumInterval);
  }
  console.log(`[${TASK_NAME}] Status`, status, isRegistered, minimumInterval);
};

const syncFormSubmission = async (photos = []) => {
  try {
    let sendNotification = false;
    console.info('[syncFormSubmision] SyncData started => ', new Date());
    // get token
    const session = await crudUsers.getActiveUser();
    // set token
    api.setToken(session.token);
    // get all datapoints to sync
    const data = await crudDataPoints.selectSubmissionToSync();
    console.info('[syncFormSubmision] data point to sync:', data.length);
    const syncProcess = data.map(async (d) => {
      const form = await crudForms.selectFormById({ id: d.form });
      const geo = d.geo ? d.geo.split('|')?.map((x) => parseFloat(x)) : [];

      const answerValues = JSON.parse(d.json.replace(/''/g, "'"));
      photos
        ?.filter((pt) => pt?.dataID === d.id)
        ?.forEach((pt) => {
          answerValues[pt?.id] = pt?.file;
        });
      const syncData = {
        formId: form.formId,
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
    return Promise.all(syncProcess)
      .then(async (res) => {
        return res;
      })
      .then(() => {
        console.info('[syncFormSubmision] Finish: ', new Date());
        if (sendNotification) {
          notification.sendPushNotification('sync-form-submission');
        }
        sendNotification = false;
      });
  } catch (err) {
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
export default backgroundTask;
