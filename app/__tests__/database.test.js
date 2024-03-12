import { mockExecuteSql } from 'expo-sqlite';
import { conn, query, tables } from '../src/database';
jest.mock('expo-sqlite');

// Create or open a mock database connection
const db = conn.init;
describe('conn.tx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    const userTable = tables[0];
    await conn.tx(db, query.initialQuery(userTable.name, userTable.fields));
  });

  afterAll(async () => {
    await db.close();
  });

  test('should execute the insert transaction successfully', async () => {
    // Define the query and parameters for insert
    const table = 'users';
    const data = [
      {
        name: 'Jhon',
        password: 'password',
      },
      {
        name: 'Leo',
        password: 'secret',
      },
    ];
    const insertQuery = data.map((d) => query.insert(table, d)).join(' ');
    const insertParams = [];
    // Execute the insert transaction
    const insertResultSet = await conn.tx(db, insertQuery, insertParams);

    // Assertions
    expect(insertQuery).toEqual(
      "INSERT INTO users(name, password) VALUES ('Jhon', 'password'); INSERT INTO users(name, password) VALUES ('Leo', 'secret');",
    );
    expect(insertResultSet).toEqual({ rowsAffected: 1 });
    expect(db.transaction).toHaveBeenCalled();
    expect(mockExecuteSql).toHaveBeenCalledWith(
      insertQuery,
      insertParams,
      expect.any(Function),
      expect.any(Function),
    );
  });

  test('should execute the update with multiple conditions successfully', async () => {
    // Define the query and parameters for update
    const table = 'users';
    const id = 2;
    const name = 'Leo';
    const where = { id, name };
    const data = { password: 'secret123' };
    const updateQuery = query.update(table, where, data);
    const updateParams = [id, name];

    // Execute the update transaction
    const updateResultSet = await conn.tx(db, updateQuery, updateParams);

    // Assertions
    expect(updateQuery).toEqual(
      "UPDATE users SET password = 'secret123' WHERE id = ? AND name = ?;",
    );
    expect(updateResultSet).toEqual({ rowsAffected: 1 });
    expect(db.transaction).toHaveBeenCalled();
    expect(mockExecuteSql).toHaveBeenCalledWith(
      updateQuery,
      updateParams,
      expect.any(Function),
      expect.any(Function),
    );
  });

  test('should execute the update with single condition successfully', async () => {
    // Define the query and parameters for update
    const table = 'users';
    const name = 'Jhon Lenon';
    const where = { id: 1 };
    const data = { name };
    const updateQuery = query.update(table, where, data);
    const updateParams = [1];

    // Execute the update transaction
    const updateResultSet = await conn.tx(db, updateQuery, updateParams);

    // Assertions
    expect(updateQuery).toEqual("UPDATE users SET name = 'Jhon Lenon' WHERE id = ?;");
    expect(updateResultSet).toEqual({ rowsAffected: 1 });
    expect(db.transaction).toHaveBeenCalled();
    expect(mockExecuteSql).toHaveBeenCalledWith(
      updateQuery,
      updateParams,
      expect.any(Function),
      expect.any(Function),
    );
  });

  test('should execute the truncate transaction successfully', async () => {
    const tables = ['users'];
    const truncateQueries = query.clear(tables);
    await conn.tx(db, truncateQueries);

    const expectedQuery = 'DELETE FROM users;';
    expect(truncateQueries).toEqual([expectedQuery]);
    expect(db.transaction).toHaveBeenCalled();
    expect(mockExecuteSql).toHaveBeenCalledWith(
      expectedQuery,
      [],
      expect.any(Function),
      expect.any(Function),
    );
  });

  test('should execute the drop transaction successfully', async () => {
    const table = 'users';
    const dropQuery = query.drop(table);
    await conn.tx(db, dropQuery);

    expect(dropQuery).toEqual('DROP TABLE IF EXISTS users;');
    expect(db.transaction).toHaveBeenCalled();
    expect(mockExecuteSql).toHaveBeenCalledWith(
      dropQuery,
      [],
      expect.any(Function),
      expect.any(Function),
    );
  });

  test('should execute the select without filtering transaction successfully', async () => {
    // Mock the result set for select
    const userData = [
      {
        name: 'John',
        password: 'password',
      },
      {
        name: 'Leo',
        password: 'secret123',
      },
    ];
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: userData.length, _array: userData } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });

    // Define the query and parameters for select
    const table = 'users';
    const selectQuery = query.read(table);
    const selectParams = [];

    // Execute the select transaction
    const result = await conn.tx(db, selectQuery, selectParams);

    // Assertions
    expect(selectQuery).toEqual('SELECT * FROM users;');
    expect(result.rows).toHaveLength(userData.length);
    expect(result.rows._array).toEqual(userData);
    expect(db.transaction).toHaveBeenCalled();
    expect(mockSelectSql).toHaveBeenCalledWith(
      selectQuery,
      selectParams,
      expect.any(Function),
      expect.any(Function),
    );
  });

  test('should execute the select with two filter transaction successfully', async () => {
    // Mock the result set for select
    const userData = [
      {
        name: 'Leo',
        password: 'secret123',
      },
    ];
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: userData.length, _array: userData } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });

    // Define the query and parameters for select
    const table = 'users';
    const password = 'secret123';
    const name = 'Leo';
    const where = { password, name };
    const selectQuery = query.read(table, where);
    const selectParams = [password, name];

    // Execute the select transaction
    const result = await conn.tx(db, selectQuery, selectParams);

    // Assertions
    expect(selectQuery).toEqual('SELECT * FROM users WHERE password = ? AND name = ?;');
    expect(result.rows).toHaveLength(userData.length);
    expect(result.rows._array).toEqual(userData);
    expect(db.transaction).toHaveBeenCalled();
    expect(mockSelectSql).toHaveBeenCalledWith(
      selectQuery,
      selectParams,
      expect.any(Function),
      expect.any(Function),
    );
  });

  test('should execute the select with no case condition', async () => {
    // Mock the result set for select
    const userData = [
      {
        name: 'Leo',
      },
    ];
    const mockSelectSql = jest.fn((query, params, successCallback) => {
      successCallback(null, { rows: { length: userData.length, _array: userData } });
    });
    db.transaction.mockImplementation((transactionFunction) => {
      transactionFunction({
        executeSql: mockSelectSql,
      });
    });

    // Define the query and parameters for select
    const table = 'users';
    const name = 'leo';
    const where = { name };
    const selectQuery = query.read(table, where, true);
    const selectParams = [name];

    // Execute the select transaction
    const result = await conn.tx(db, selectQuery, selectParams);

    // Assertions
    expect(selectQuery).toEqual('SELECT * FROM users WHERE name = ? COLLATE NOCASE;');
    expect(result.rows).toHaveLength(userData.length);
    expect(result.rows._array).toEqual(userData);
    expect(db.transaction).toHaveBeenCalled();
    expect(mockSelectSql).toHaveBeenCalledWith(
      selectQuery,
      selectParams,
      expect.any(Function),
      expect.any(Function),
    );
  });

  test('should execute query where null successfully', async () => {
    const table = 'users';
    const where = { name: null };
    const selectWhereNull = query.read(table, where);

    expect(selectWhereNull).toEqual('SELECT * FROM users WHERE name IS NULL;');
  });
});
