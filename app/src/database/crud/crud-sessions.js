import { conn, query } from '..';

const db = conn.init;

const sessionsQuery = () => ({
  selectLastSession: async () => {
    try {
      const { rows } = await conn.tx(db, query.read('sessions', []));
      if (!rows.length) {
        return false;
      }
      return rows._array[rows.length - 1];
    } catch (error) {
      return false;
    }
  },
  addSession: async (data = { token: '', passcode: '' }) => {
    const res = await conn.tx(db, query.insert('sessions', data));
    return res;
  },
});

const crudSessions = sessionsQuery();

export default crudSessions;
