import { conn, query } from '../';

const db = conn.init;

const formsQuery = () => {
  return {
    selectLatestFormVersion: async ({ user }) => {
      const latest = 1;
      const selectJoin = `SELECT
          f.id,
          f.userId,
          f.formId,
          f.version,
          f.name,
          f.json,
          COUNT(
            DISTINCT CASE WHEN dp.submitted = 1
            THEN dp.id END
          ) AS submitted,
          COUNT(
            DISTINCT CASE WHEN dp.submitted = 0
            AND dp.syncedAt IS NULL THEN dp.id END
          ) AS draft,
          COUNT(
            DISTINCT CASE WHEN dp.submitted = 1
            AND dp.syncedAt IS NOT NULL THEN dp.id END
          ) AS synced
        FROM forms f
        LEFT JOIN datapoints dp ON f.id = dp.form AND dp.user = ?
        WHERE f.latest = ?
        GROUP BY f.id, f.formId, f.version, f.name, f.json;`;
      const { rows } = await conn.tx(db, selectJoin, [user, latest]);
      if (!rows.length) {
        return [];
      }
      return rows._array;
    },
    selectFormById: async ({ id }) => {
      const { rows } = await conn.tx(db, query.read('forms', { id }), [id]);
      if (!rows.length) {
        return {};
      }
      return rows._array[0];
    },
    selectFormByIdAndVersion: async ({ id: formId, version }) => {
      const { rows } = await conn.tx(db, query.read('forms', { formId, version }), [
        formId,
        version,
      ]);
      if (!rows.length) {
        return false;
      }
      return rows._array[0];
    },
    addForm: async ({ userId, id: formId, version, formJSON }) => {
      const insertQuery = query.insert('forms', {
        userId: userId || 0,
        formId: formId,
        version: version,
        latest: 1,
        name: formJSON?.name || null,
        json: formJSON ? JSON.stringify(formJSON).replace(/'/g, "''") : null,
        createdAt: new Date().toISOString(),
      });
      return await conn.tx(db, insertQuery, []);
    },
    updateForm: async ({ id: formId, latest = 0 }) => {
      // update latest to false
      const updateQuery = query.update('forms', { formId }, { latest: latest });
      return await conn.tx(db, updateQuery, [formId]);
    },
    getMyForms: async () => {
      const sqlQuery = 'SELECT id, name FROM forms';
      const { rows } = await conn.tx(db, sqlQuery);

      if (!rows.length) {
        return {};
      }
      return rows._array;
    },
  };
};

const crudForms = formsQuery();

export default crudForms;
