import { conn, query } from '..';

const db = conn.init;

const selectDataPointById = async ({ id }) => {
  const { rows } = await conn.tx(db, query.read('datapoints', { id }), [id]);
  if (!rows.length) {
    return {};
  }
  const current = rows._array[0];
  return {
    ...current,
    json: JSON.parse(current.json.replace(/''/g, "'")),
  };
};

const dataPointsQuery = () => ({
  selectDataPointById,
  selectDataPointsByFormAndSubmitted: async ({ form, submitted, user }) => {
    const columns = user ? { form, submitted, user } : { form, submitted };
    const params = user ? [form, submitted, user] : [form, submitted];
    const { rows } = await conn.tx(db, query.read('datapoints', { ...columns }), [...params]);
    if (!rows.length) {
      return [];
    }
    return rows._array;
  },
  selectSubmissionToSync: async () => {
    const submitted = 1;
    const { rows } = await conn.tx(
      db,
      `
        SELECT
          datapoints.*,
          forms.formId,
          forms.json AS json_form
        FROM datapoints
        JOIN forms ON datapoints.form = forms.id
        WHERE datapoints.submitted = ? AND datapoints.syncedAt IS NULL`,
      [submitted],
    );
    if (!rows.length) {
      return [];
    }
    return rows._array;
  },
  saveDataPoint: async ({ form, user, name, geo, submitted, duration, json }) => {
    const submittedAt = submitted ? { submittedAt: new Date().toISOString() } : {};
    const geoVal = geo ? { geo } : {};
    const insertQuery = query.insert('datapoints', {
      form,
      user,
      name,
      ...geoVal,
      submitted,
      duration,
      createdAt: new Date().toISOString(),
      ...submittedAt,
      json: json ? JSON.stringify(json).replace(/'/g, "''") : null,
    });
    const res = await conn.tx(db, insertQuery, []);
    return res;
  },
  updateDataPoint: async ({ id, name, geo, submitted, duration, submittedAt, syncedAt, json }) => {
    const updateQuery = query.update(
      'datapoints',
      { id },
      {
        name,
        geo,
        submitted,
        duration,
        submittedAt: submitted && !submittedAt ? new Date().toISOString() : submittedAt,
        syncedAt,
        json: json ? JSON.stringify(json).replace(/'/g, "''") : null,
      },
    );
    const res = await conn.tx(db, updateQuery, [id]);
    return res;
  },
});

const crudDataPoints = dataPointsQuery();

export default crudDataPoints;
