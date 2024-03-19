import { conn, query } from '..';

const db = conn.init;

const monitoringQuery = () => ({
  syncForm: async ({ formId, lastUpdated, formJSON }) => {
    const findQuery = query.read('monitoring', { uuid: formJSON.uuid });
    const { rows } = await conn.tx(db, findQuery, [formJSON.uuid]);
    if (rows.length) {
      const monitoringID = rows._array[0].id;
      const updateQuery = query.update(
        'monitoring',
        { id: monitoringID },
        {
          json: formJSON ? JSON.stringify(formJSON.answers).replace(/'/g, "''") : null,
        },
      );
      const res = await conn.tx(db, updateQuery, [monitoringID]);
      return res;
    }
    const insertQuery = query.insert('monitoring', {
      formId,
      uuid: formJSON.uuid,
      name: formJSON?.datapoint_name || null,
      json: formJSON ? JSON.stringify(formJSON.answers).replace(/'/g, "''") : null,
      syncedAt: lastUpdated, // store last updated instead of unnecessary current time
    });
    const res = await conn.tx(db, insertQuery, []);
    return res;
  },
  getTotal: async (formId, search) => {
    const querySQL = search.length
      ? `SELECT COUNT(*) AS count FROM monitoring where formId = ? AND name LIKE ? COLLATE NOCASE`
      : `SELECT COUNT(*) AS count FROM monitoring where formId = ? `;
    const params = search.length ? [formId, search] : [formId];
    const { rows } = await conn.tx(db, querySQL, params);
    return rows._array?.[0]?.count;
  },
  getFormsPaginated: async ({ formId, search = '', limit = 10, offset = 0 }) => {
    let sqlQuery = 'SELECT * FROM monitoring WHERE formId = $1';
    const queryParams = [formId];

    if (search.trim() !== '') {
      sqlQuery += ' AND name LIKE $2 COLLATE NOCASE';
      queryParams.push(`%${search}%`);
    }

    sqlQuery += ' ORDER BY syncedAt DESC LIMIT $3 OFFSET $4';
    queryParams.push(limit, offset * limit); // Fix offset calculation
    const { rows } = await conn.tx(db, sqlQuery, queryParams);

    if (!rows.length) {
      return [];
    }
    return rows._array;
  },
});

const crudMonitoring = monitoringQuery();

export default crudMonitoring;
