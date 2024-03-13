const insert = (table, data = {}) => {
  const fields = Object.keys(data);
  const valuesString = fields
    .map((key) => (Number.isNaN(data[key]) ? `'${data[key]}'` : data[key]))
    .join(', ');
  const fieldsString = fields.join(', ');
  return `INSERT INTO ${table}(${fieldsString}) VALUES (${valuesString});`;
};

const insertPrepared = (table, data = {}) => {
  const fields = Object.keys(data);
  const valuePlaceholders = fields.map((_, index) => `$${index + 1}`).join(', ');
  const fieldsString = fields.join(', ');
  const values = fields.map((key) => data[key]);

  const query = `INSERT INTO ${table}(${fieldsString}) VALUES (${valuePlaceholders});`;
  return { query, values };
};

const update = (table, where = {}, data = {}) => {
  const fieldString = Object.keys(data)
    .map((key) => (Number.isNaN(data[key]) ? `${key} = '${data[key]}'` : `${key} = ${data[key]}`))
    .join(', ');
  const conditions = Object.keys(where).map((key) => `${key} = ?`);
  const conditionString = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return `UPDATE ${table} SET ${fieldString} ${conditionString};`;
};

const read = (table, where = {}, nocase = false, orderBy = null, orderType = 'ASC') => {
  const conditions = Object.keys(where).map((key) =>
    where[key] === null ? `${key} IS NULL` : `${key} = ?`,
  );
  let conditionString = null;
  if (conditions.length) {
    conditionString = `WHERE ${conditions.join(' AND ')}`;
    if (nocase) {
      conditionString += ' COLLATE NOCASE';
    }
  }
  const orderQueryString = orderBy ? `ORDER BY ${orderBy} ${orderType}` : null;
  return `${[`SELECT * FROM ${table}`, conditionString, orderQueryString]
    .filter((q) => q)
    .join(' ')};`;
};

const clear = (tables = []) => tables.map((t) => `DELETE FROM ${t};`);

const drop = (table) => `DROP TABLE IF EXISTS ${table};`;

const count = (table) => `SELECT COUNT(*) AS count FROM ${table}`;

const initialQuery = (tableName, columns) => {
  const fields = Object.keys(columns).map((key) => `${key} ${columns[key]}`);
  const fieldsString = fields.join(', ');
  return `CREATE TABLE IF NOT EXISTS ${tableName}(${fieldsString});`;
};

const query = {
  insert,
  update,
  read,
  clear,
  drop,
  count,
  initialQuery,
  insertPrepared,
};

export default query;
