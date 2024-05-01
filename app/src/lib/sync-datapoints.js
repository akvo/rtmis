import { crudCertification, crudMonitoring } from '../database/crud';
import { DatapointSyncState } from '../store';
import api from './api';

export const fetchDatapoints = async (isCertification = false, pageNumber = 1) => {
  try {
    const { data: apiData } = await api.get(
      `/datapoint-list?certification=${isCertification}&page=${pageNumber}`,
    );
    const { data, total_page: totalPage, current: page } = apiData;
    DatapointSyncState.update((s) => {
      s.progress = (page / totalPage) * 100;
    });
    if (page < totalPage) {
      return data.concat(await fetchDatapoints(isCertification, page + 1));
    }
    return data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const downloadDatapointsJson = async (
  isCertification,
  { formId, administrationId, url, lastUpdated, submissionType },
) => {
  try {
    const response = await api.get(url);
    if (response.status === 200) {
      const jsonData = response.data;
      if (isCertification) {
        await crudCertification.syncForm({
          formId,
          administrationId,
          lastUpdated,
          submissionType,
          formJSON: jsonData,
        });
      } else {
        await crudMonitoring.syncForm({
          formId,
          administrationId,
          lastUpdated,
          formJSON: jsonData,
        });
      }
    }
  } catch (error) {
    Promise.reject(error);
  }
};
