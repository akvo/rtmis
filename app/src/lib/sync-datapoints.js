import { crudMonitoring } from '../database/crud';
import api from './api';

export const fetchDatapoints = async (form, pageNumber = 1, allData = []) => {
  try {
    const response = await api.get(`/datapoint-list?page=${pageNumber}&form=${form}`);
    const data = response.data.data;

    const updatedData = [...allData, ...data];

    if (data.hasMorePages) {
      return fetchDatapoints(form, pageNumber + 1, updatedData);
    } else {
      return updatedData;
    }
  } catch (error) {
    return Promise.reject(error);
  }
};

export const downloadDatapointsJson = async (formId, url) => {
  try {
    const response = await api.get(url);
    if (response.status === 200) {
      const jsonData = response.data;
      const res = await crudMonitoring.syncForm({
        formId,
        formJSON: jsonData,
      });
      console.info('[SYNCED MONITORING]', res);
    }
  } catch (error) {
    return Promise.reject(error);
  }
};
