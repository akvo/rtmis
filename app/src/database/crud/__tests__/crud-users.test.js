import crudUsers from '../crud-users';
import conn from '../../conn';

jest.mock('expo-sqlite');

const db = conn.init;

const users = [
  {
    id: 1,
    name: 'John Doe',
    password: 'password',
    active: 1,
  },
  {
    id: 2,
    name: 'Jane Doe',
    password: 'password',
    active: 0,
  },
];

describe('crudUsers function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveUser', () => {
    it('should return false if active user does not exist', async () => {
      const mockData = [];
      const mockSelectSql = jest.fn((query, params, successCallback) => {
        successCallback(null, { rows: { length: mockData.length, _array: mockData } });
      });
      db.transaction.mockImplementation((transactionFunction) => {
        transactionFunction({
          executeSql: mockSelectSql,
        });
      });
      const result = await crudUsers.getActiveUser();
      expect(result).toBe(false);
    });

    it('should return active user', async () => {
      const mockData = users.filter((u) => u.active);
      const mockSelectSql = jest.fn((query, params, successCallback) => {
        successCallback(null, { rows: { length: mockData.length, _array: mockData } });
      });
      db.transaction.mockImplementation((transactionFunction) => {
        transactionFunction({
          executeSql: mockSelectSql,
        });
      });
      const result = await crudUsers.getActiveUser();
      expect(result).toEqual(mockData[0]);
    });
  });

  describe('selectUserById', () => {
    it('should return {} if user with given id not found', async () => {
      const mockData = [];
      const mockSelectSql = jest.fn((query, params, successCallback) => {
        successCallback(null, { rows: { length: mockData.length, _array: mockData } });
      });
      db.transaction.mockImplementation((transactionFunction) => {
        transactionFunction({
          executeSql: mockSelectSql,
        });
      });
      const result = await crudUsers.selectUserById({ id: 1 });
      expect(result).toEqual({});
    });

    it('should return user if user with given id found', async () => {
      const mockData = users.filter((u) => u.id === 1);
      const mockSelectSql = jest.fn((query, params, successCallback) => {
        successCallback(null, { rows: { length: mockData.length, _array: mockData } });
      });
      db.transaction.mockImplementation((transactionFunction) => {
        transactionFunction({
          executeSql: mockSelectSql,
        });
      });
      const result = await crudUsers.selectUserById({ id: 1 });
      expect(result).toEqual(mockData[0]);
    });
  });
});
