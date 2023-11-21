import { query } from '../query';
import { conn } from '../conn';
jest.mock('expo-sqlite');
/**
 * negative test cases
 */
db = conn.init;

describe('query negative tests cases', () => {
  test('invalid insert query', () => {
    const table = 'config';
    const insertQuery = query.insert(table);
    expect(insertQuery).toEqual('INSERT INTO config() VALUES ();');
    conn.tx(db, insertQuery, []).catch((err) => {
      expect(err).toEqual(false);
    });
  });
  test('invalid update query', () => {
    const table = 'config';
    const updateQuery = query.update(table);
    expect(updateQuery).toEqual('UPDATE config SET  ;');
    conn.tx(db, updateQuery, []).catch((err) => {
      expect(err).toEqual(false);
    });
  });
});
