import { act, renderHook, waitFor } from '@testing-library/react-native';
import { conn } from '../conn';
import exampledb from 'assets/example.db';

jest.mock('expo-asset', () => {
  return {
    Asset: {
      fromModule: jest.fn((module) => ({
        uri: `mocked-uri-for-${module}`,
      })),
    },
  };
});

jest.mock('expo-file-system', () => {
  return {
    getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
    makeDirectoryAsync: jest.fn(),
    downloadAsync: jest.fn(),
  };
});

jest.mock('expo-sqlite');

const mockDb = conn.init;

describe('conn library', () => {
  it('should have db connection from file', async () => {
    const dbFile = exampledb;
    const db = await conn.file(dbFile, 'example');

    await waitFor(() => {
      expect(db.transaction).toBeDefined();
    });
  });

  it('should execute a single query correctly', async () => {
    const query = 'SELECT * FROM users';
    const params = [];
    const result = await conn.tx(mockDb, query, params);
    expect(result).toEqual({ rows: { length: 0, _array: [] } });
  });

  it('should execute multiple queries correctly', async () => {
    const queries = ['SELECT * FROM users', 'SELECT * FROM orders'];
    const params = [];
    const result = await conn.tx(mockDb, queries, params);
    expect(result).toEqual([
      { rows: { length: 0, _array: [] } },
      { rows: { length: 0, _array: [] } },
    ]);
  });

  it('should reject and rollback the transaction on query error', async () => {
    const expectedError = new Error('Database error');
    const mockInvalidSql = jest.fn((query, params, successCallback, errorCallback) => {
      errorCallback(null, expectedError);
    });
    mockDb.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockInvalidSql,
      });
    });
    const query = 'INVALID SQL';
    const params = [];
    try {
      await conn.tx(mockDb, query, params);
    } catch (error) {
      expect(error).toBeTruthy();
      expect(error).toEqual(expectedError);
    }
  });

  it('should reject and rollback the transaction on multiple queries error', async () => {
    const queries = ['SELECT * FROM users', 'INVALID SQL'];
    const params = [];
    try {
      await conn.tx(mockDb, queries, params);
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it('should reject and handle transaction error', async () => {
    mockDb.transaction.mockImplementation((transactionFunc, errorCallback) => {
      errorCallback('Transaction error');
    });
    const query = 'SELECT * FROM users';
    const params = [];
    try {
      await conn.tx(mockDb, query, params);
    } catch (error) {
      expect(error).toBeTruthy();
      console.log('error', error);
    }
  });
});
