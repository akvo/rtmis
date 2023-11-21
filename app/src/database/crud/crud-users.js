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
  };
};

const crudUsers = usersQuery();

export default crudUsers;
