import { conn, query } from '..';
import defaultBuildParams from '../../build';

const db = conn.init;

const configQuery = () => {
  const id = 1;
  return {
    getConfig: async () => {
      try {
        const { rows } = await conn.tx(db, query.read('config', { id }), [id]);
        if (!rows.length) {
          return false;
        }
        return rows._array[rows.length - 1];
      } catch {
        return false;
      }
    },
    addConfig: async (data = {}) => {
      const insertQuery = query.insert('config', {
        id,
        appVersion: defaultBuildParams.appVersion,
        ...data,
      });
      const res = await conn.tx(db, insertQuery, []);
      return res;
    },
    updateConfig: async (data) => {
      const updateQuery = query.update('config', { id }, { ...data });
      const res = await conn.tx(db, updateQuery, [id]);
      return res;
    },
  };
};

const crudConfig = configQuery();

export default crudConfig;
