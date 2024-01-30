import { conn, query } from '../';

const db = conn.init;

const usersQuery = () => {
  return {
    getActiveUser: async () => {
      try {
        const active = 1;
        const { rows } = await conn.tx(db, query.read('users', { active }), [active]);
        if (!rows.length) {
          return false;
        }
        return rows._array[0];
      } catch (error) {
        console.error('Get users', error);
        return false;
      }
    },
    selectUserById: async ({ id }) => {
      const { rows } = await conn.tx(db, query.read('users', { id }), [id]);
      if (!rows.length) {
        return {};
      }
      return rows._array[0];
    },
    addNew: async (payload) => {
      const { insertId } = await conn.tx(db, query.insert('users', payload), []);
      return insertId;
    },
    toggleActive: async ({ id, active }) => {
      try {
        const { rowsAffected } = await conn.tx(
          db,
          query.update('users', { id }, { active: !active }),
          [id],
        );
        return rowsAffected;
      } catch (error) {
        console.error('Toggle active:', error);
        return false;
      }
    },
    checkPasscode: async (passcode) => {
      const { rows } = await conn.tx(db, query.read('users', { password: passcode }), [passcode]);
      return rows;
    },
    getUserAdministrationListChunk: async (userId, start, end) => {
      try {
        const sqlQuery = 'SELECT administrationList FROM users WHERE id = ?';
        const { rows } = await conn.tx(db, sqlQuery, [userId]);

        if (!rows.length || !rows._array[0].administrationList) {
          return [];
        }

        const fullList = JSON.parse(rows._array[0].administrationList);
        const chunk = fullList.slice(start, end);
        return chunk;
      } catch (error) {
        console.error('Get user administration list chunk:', error);
        return [];
      }
    },
  };
};

const crudUsers = usersQuery();

export default crudUsers;
