import { act } from '@testing-library/react-native';
import crudDataPoints from '../crud-datapoints';
import conn from '../../conn';

jest.mock('expo-sqlite');

const db = conn.init;

const dataPoints = [
  {
    id: 1,
    form: 123,
    user: 1,
    name: 'Data point 1 name',
    geo: '-8.676119|115.4927994',
    submitted: 1,
    duration: 2.5,
    createdAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    syncedAt: null,
    json: [{ 101: 'Data point 1', 102: 1 }],
  },
  {
    id: 2,
    form: 123,
    user: 1,
    name: 'Data point 2 name',
    geo: '-8.676119|115.4927994',
    submitted: 0,
    duration: 2.0,
    createdAt: new Date().toISOString(),
    submittedAt: null,
    syncedAt: null,
    json: [{ 101: 'Data point 2', 102: 2 }],
  },
  {
    id: 3,
    form: 123,
    user: 2,
    name: 'Data point 3 name',
    geo: '-8.676119|115.4927994',
    submitted: 0,
    duration: 2.7,
    createdAt: new Date().toISOString(),
    submittedAt: null,
    syncedAt: null,
    json: [{ 101: 'Data point 3', 102: 3 }],
  },
];

describe('crudDataPoints function', () => {
  test('selectDataPointById should return an empty object when given an invalid ID', async () => {
    await act(async () => {
      const result = await crudDataPoints.selectDataPointById({ id: 1 });
      expect(result).toEqual({});
    });
  });

  test('saveDataPoint should save the data point to the database correctly', async () => {
    await act(async () => {
      const saveValue = dataPoints[0];
      const result = await crudDataPoints.saveDataPoint({ ...saveValue });
      expect(result).toEqual({ rowsAffected: 1 });
    });
  });

  test('updateDataPoint should update the data point in the database correctly', async () => {
    await act(async () => {
      const updateValue = { ...dataPoints[0], syncedAt: new Date().toISOString() };
      const result = await crudDataPoints.updateDataPoint({ ...updateValue });
      expect(result).toEqual({ rowsAffected: 1 });
    });
  });

  test('selectDataPointById should return the correct data point when given a valid ID', async () => {
    const mockData = dataPoints
      .filter((d) => d.id === 1)
      .map((d) => ({ ...d, json: JSON.stringify(d.json) }));
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: mockData.length, _array: mockData } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });
    const result = await crudDataPoints.selectDataPointById({ id: 1 });
    expect(result).toEqual(dataPoints[0]);
  });

  test('selectDataPointsByFormAndSubmitted should return the correct list of submitted data points', async () => {
    const mockData = dataPoints.filter((d) => d.form === 123 && d.submitted);
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: mockData.length, _array: mockData } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });
    const result = await crudDataPoints.selectDataPointsByFormAndSubmitted({
      form: 123,
      submitted: 1,
    });
    expect(result).toEqual(mockData);
  });

  test('selectDataPointsByFormAndSubmitted should return the correct list of saved data points', async () => {
    const mockData = dataPoints.filter((d) => d.form === 123 && !d.submitted);
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: mockData.length, _array: mockData } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });
    const result = await crudDataPoints.selectDataPointsByFormAndSubmitted({
      form: 123,
      submitted: 0,
    });
    expect(result).toEqual(mockData);
  });

  test('selectDataPointsByFormAndSubmitted should return the correct list of saved data points filtered by user id', async () => {
    const mockData = dataPoints.filter((d) => d.form === 123 && !d.submitted && d.user === 2);
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: mockData.length, _array: mockData } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });
    const result = await crudDataPoints.selectDataPointsByFormAndSubmitted({
      form: 123,
      submitted: 0,
      user: 2,
    });
    expect(result).toEqual(mockData);
  });

  test('selectSubmissionToSync should return all submitted data point with syncedAt null', async () => {
    const mockData = dataPoints.filter((d) => !d.submitted && !d.syncedAt);
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: mockData.length, _array: mockData } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });
    const result = await crudDataPoints.selectSubmissionToSync();
    expect(result).toEqual(mockData);
  });

  test('selectSubmissionToSync should return [] if no data points defined', async () => {
    const mockData = [];
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: mockData.length, _array: mockData } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });
    const result = await crudDataPoints.selectSubmissionToSync();
    expect(result).toEqual(mockData);
  });
});
