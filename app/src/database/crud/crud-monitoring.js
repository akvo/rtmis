import { conn, query } from '../';

const db = conn.init;

const monitoringQuery = () => {
  return {
    addForm: async ({ formId, formJSON }) => {
      const insertQuery = query.insert('monitoring', {
        formId: formId,
        uuid: formJSON?.uuid,
        administration: formJSON?.uuid,
        name: formJSON?.datapoint_name || null,
        json: formJSON ? JSON.stringify(formJSON.answers).replace(/'/g, "''") : null,
        syncedAt: new Date().toISOString(),
      });
      return await conn.tx(db, insertQuery, []);
    },
    getAllForms: async () => {
      const sqlQuery = 'SELECT formId FROM monitoring';
      const { rows } = await conn.tx(db, sqlQuery);

      if (!rows.length) {
        return {};
      }
      return rows._array;
    },
  };
};

const crudMonitoring = monitoringQuery();

export default crudMonitoring;
