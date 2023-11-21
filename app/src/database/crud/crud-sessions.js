import { conn, query } from '../';

const db = conn.init;

const sessionsQuery = () => {
  return {
    selectLastSession: async () => {
      try {
        const { rows } = await conn.tx(db, query.read('sessions', []));
        if (!rows.length) {
          return false;
        }
        return rows._array[rows.length - 1];
      } catch (error) {
        console.error('Get sessions', error);
        return false;
      }
    },
    addSession: async (data = { token: '', passcode: '' }) => {
      return await conn.tx(db, query.insert('sessions', data));
    },
  };
};

const crudSessions = sessionsQuery();

export default crudSessions;
