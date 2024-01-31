import { conn, query } from '../';
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
      } catch {}
    },
    addConfig: async (data = {}) => {
      const insertQuery = query.insert('config', {
        id,
        appVersion: defaultBuildParams.appVersion,
        ...data,
      });
      return await conn.tx(db, insertQuery, []);
    },
    updateConfig: async (data) => {
      const updateQuery = query.update('config', { id }, { ...data });
      return await conn.tx(db, updateQuery, [id]);
    },
  };
};

const crudConfig = configQuery();

export default crudConfig;
