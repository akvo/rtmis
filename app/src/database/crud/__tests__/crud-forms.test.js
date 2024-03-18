import crudForms from '../crud-forms';
import conn from '../../conn';

jest.mock('expo-sqlite');
const db = conn.init;

describe('crudForms function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addForm', () => {
    it('should insert the form', async () => {
      const formId = 1;
      const version = 1;
      const formJSON = { id: 1, version: 1, name: 'Form 1' };
      const result = await crudForms.addForm({ id: formId, version, formJSON });
      expect(result).toEqual({ rowsAffected: 1 });
    });
  });

  describe('updateForm', () => {
    it('should update the form, set latest to 0', async () => {
      const formId = 1;
      const result = await crudForms.updateForm({ id: formId });
      expect(result).toEqual({ rowsAffected: 1 });
    });
  });

  describe('selectLatestFormVersion and selectFormByIdAndVersion', () => {
    const formData = [
      {
        id: 1,
        formId: 123,
        name: 'Form Test',
        latest: 1,
        version: '1.0.0',
        json: { id: 1, version: 1, name: 'Form 1' },
      },
    ];

    test('selectLatestFormVersion should return [] if the latest form version does not exist', async () => {
      const mockSelectSql = jest.fn((query, params, successCallback) => {
        successCallback(null, { rows: { length: 0, _array: [] } });
      });
      db.transaction.mockImplementation((transactionFunction) => {
        transactionFunction({
          executeSql: mockSelectSql,
        });
      });
      const result = await crudForms.selectLatestFormVersion({ user: 2 });
      expect(result).toEqual([]);
    });

    test('selectFormByIdAndVersion should return false if the form does not exist', async () => {
      const mockData = formData.filter((f) => f.id === 1 && f.version === '1.0.1');
      const mockSelectSql = jest.fn((query, params, successCallback) => {
        successCallback(null, { rows: { length: mockData.length, _array: mockData } });
      });
      db.transaction.mockImplementation((transactionFunction) => {
        transactionFunction({
          executeSql: mockSelectSql,
        });
      });
      const result = await crudForms.selectFormByIdAndVersion({ id: 1, version: '1.0.1' });
      expect(result).toBe(false);
    });

    test('selectLatestFormVersion should return the forms with stats if it exists', async () => {
      const formTest = [
        {
          id: 1,
          formId: 123,
          name: 'Form Test',
          latest: 1,
          version: '1.0.0',
          json: { id: 1, version: 1, name: 'Form 1' },
          submitted: 2,
          draft: 3,
          synced: 1,
        },
      ];
      const mockSelectSql = jest.fn((query, params, successCallback) => {
        successCallback(null, { rows: { length: formTest.length, _array: formTest } });
      });
      db.transaction.mockImplementation((transactionFunction) => {
        transactionFunction({
          executeSql: mockSelectSql,
        });
      });
      const result = await crudForms.selectLatestFormVersion({ user: 1 });
      expect(result).toEqual(formTest);
    });

    test('selectFormByIdAndVersion should return the form if it exists', async () => {
      const mockData = formData.filter((f) => f.id === 1 && f.version === '1.0.0');
      const mockSelectSql = jest.fn((query, params, successCallback) => {
        successCallback(null, { rows: { length: mockData.length, _array: mockData } });
      });
      db.transaction.mockImplementation((transactionFunction) => {
        transactionFunction({
          executeSql: mockSelectSql,
        });
      });
      const result = await crudForms.selectFormByIdAndVersion({ id: 1, version: '1.0.0' });
      expect(result).toEqual(mockData[0]);
    });

    test('selectFormById should return the correct form value when given a valid ID', async () => {
      const mockData = [
        {
          id: 1,
          version: 1,
          name: 'Form 1',
          json: JSON.stringify({ id: 1, version: 1, name: 'Form 1', question_group: [] }),
        },
      ];
      const mockSelectSql = jest.fn((query, params, successCallback) => {
        successCallback(null, { rows: { length: mockData.length, _array: mockData } });
      });
      db.transaction.mockImplementation((transactionFunction) => {
        transactionFunction({
          executeSql: mockSelectSql,
        });
      });
      const result = await crudForms.selectFormById({ id: 1 });
      const mockResult = mockData[0];
      expect(result).toEqual({
        ...mockResult,
        json: mockResult.json,
      });
    });
  });
});
