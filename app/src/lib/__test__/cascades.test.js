import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { act, waitFor } from 'react-native-testing-library';

import cascades from '../cascades';

jest.mock('expo-sqlite');

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(async () => ({ exists: false })), // Change to { exists: true } for different scenarios
  makeDirectoryAsync: jest.fn(async () => {}),
  documentDirectory: 'test-document-directory/', // Set any value you need for testing
  downloadAsync: jest.fn(async (downloadUrl, fileUrl) => ({
    downloadUrl,
    fileUrl,
  })),
  readDirectoryAsync: jest.fn(async (fileUri) => ['file.sqlite', 'file.sqlite-journal', 'db.db']),
  deleteAsync: jest.fn(async (fileUri) => true),
}));

const { DIR_NAME } = cascades;

describe('cascades', () => {
  it('should create the sqlite directory if it does not exist', async () => {
    // Call the function
    await cascades.createSqliteDir();

    // Assertions
    expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('test-document-directory/' + DIR_NAME);
    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
      'test-document-directory/' + DIR_NAME,
    );
  });

  it('should download the file if it does not exist', async () => {
    // Call the function with test URLs
    const downloadUrl = 'https://example.com/api/v1/device/sqlite/file.sqlite';
    const fileUrl = '/device/sqlite/file.sqlite';
    act(() => {
      cascades.download(downloadUrl, fileUrl);
    });

    await waitFor(() => {
      // Assertions
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(
        `test-document-directory/${DIR_NAME}/file.sqlite`,
      );
      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        downloadUrl,
        `test-document-directory/${DIR_NAME}/file.sqlite`,
        { cache: false },
      );
    });
  });

  it('should not download the file if it already exists', () => {
    // Mocking that the file already exists
    FileSystem.getInfoAsync.mockImplementationOnce(async () => ({ exists: true }));

    // Call the function with test URLs
    const downloadUrl = 'https://example.com/sqlite/file.sqlite';
    const fileUrl = '/sqlite/file.sqlite';
    cascades.download(downloadUrl, fileUrl);

    // Assertions
    expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(
      `test-document-directory/${DIR_NAME}/file.sqlite`,
    );
    expect(FileSystem.downloadAsync).not.toHaveBeenCalled();
  });

  it('should not create the sqlite directory if it already exists', async () => {
    // Mocking that the file already exists
    FileSystem.getInfoAsync.mockImplementationOnce(async () => ({ exists: true }));

    const notCreated = await cascades.createSqliteDir();
    expect(notCreated).toBeUndefined();
  });

  it('should load the data source from downloaded sqlite', async () => {
    const cascadesData = [
      {
        id: 1,
        name: 'DI Yogyakarta',
        parent: 0,
      },
      {
        id: 2,
        name: 'KAB. Bantul',
        parent: 1,
      },
    ];

    const questionSource = { file: 'file.sqlite', parent_id: 0 };

    const db = SQLite.openDatabase(questionSource.file);
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: cascadesData.length, _array: cascadesData } });
    });

    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });

    const result = await cascades.loadDataSource(questionSource);

    const selectQuery = 'SELECT * FROM nodes;';
    expect(result.rows).toHaveLength(cascadesData.length);
    expect(result.rows._array).toEqual(cascadesData);
    expect(db.transaction).toHaveBeenCalled();
    expect(mockSelectSql).toHaveBeenCalledWith(
      selectQuery,
      [],
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('should drop all files in SQLITE directoy correctly', async () => {
    const Sqlfiles = await cascades.dropFiles();
    expect(Sqlfiles).toEqual(['file.sqlite', 'file.sqlite-journal', 'db.db']);
  });
});
