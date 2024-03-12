export const mockResultSet = { rowsAffected: 1 };

export const mockExecuteSql = jest.fn((query, params, successCallback) => {
  if (query.startsWith('SELECT')) {
    successCallback(null, { rows: { length: 0, _array: [] } });
  } else {
    successCallback(null, mockResultSet);
  }
});

const mockTransaction = jest.fn((transactionFunction) => {
  transactionFunction({
    executeSql: mockExecuteSql,
  });
});

export const openDatabase = jest.fn(() => ({
  transaction: mockTransaction,
  close: jest.fn(),
}));
