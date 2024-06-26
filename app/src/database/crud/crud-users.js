import { conn, query } from '..';

const db = conn.init;

const usersQuery = () => ({
  getActiveUser: async () => {
    try {
      const active = 1;
      const { rows } = await conn.tx(db, query.read('users', { active }), [active]);
      if (!rows.length) {
        return false;
      }
      return rows._array[0];
    } catch (error) {
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
    const params = {
      ...payload,
      certifications: payload?.certifications
        ? JSON.stringify(payload.certifications).replace(/'/g, "''")
        : null,
    };
    const { insertId } = await conn.tx(db, query.insert('users', params), []);
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
      return false;
    }
  },
  checkPasscode: async (passcode) => {
    const { rows } = await conn.tx(db, query.read('users', { password: passcode }), [passcode]);
    return rows;
  },
  updateLastSynced: async (id) => {
    const updateQuery = query.update('users', { id }, { lastSyncedAt: new Date().toISOString() });
    const { rows } = await conn.tx(db, updateQuery, [id]);
    return rows;
  },
});

const crudUsers = usersQuery();

export default crudUsers;
