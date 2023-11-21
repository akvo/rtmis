const insert = (table, data = {}) => {
  const fields = Object.keys(data);
  const valuesString = fields
    .map((key) => (isNaN(data[key]) ? `'${data[key]}'` : data[key]))
    .join(', ');
  const fieldsString = fields.join(', ');
  return `INSERT INTO ${table}(${fieldsString}) VALUES (${valuesString});`;
};

const update = (table, where = {}, data = {}) => {
  const fieldString = Object.keys(data)
    .map((key) => (isNaN(data[key]) ? `${key} = '${data[key]}'` : `${key} = ${data[key]}`))
    .join(', ');
  const conditions = Object.keys(where).map((key) => `${key} = ?`);
  const conditionString = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return `UPDATE ${table} SET ${fieldString} ${conditionString};`;
};

const read = (table, where = {}, nocase = false) => {
  const conditions = Object.keys(where).map((key) => {
    return where[key] === null ? `${key} IS NULL` : `${key} = ?`;
  });
  let conditionString = '';
  if (conditions.length) {
    conditionString = `WHERE ${conditions.join(' AND ')}`;
    if (nocase) {
      conditionString += ' COLLATE NOCASE';
    }
  }
  return `SELECT * FROM ${table} ${conditionString};`;
};

const clear = (tables = []) => {
  return tables.map((t) => `DELETE FROM ${t};`);
};

const drop = (table) => {
  return `DROP TABLE IF EXISTS ${table};`;
};

const count = (table) => {
  return `SELECT COUNT(*) AS count FROM ${table}`;
};

const initialQuery = (tableName, columns) => {
  const fields = Object.keys(columns).map((key) => `${key} ${columns[key]}`);
  const fieldsString = fields.join(', ');
  return `CREATE TABLE IF NOT EXISTS ${tableName}(${fieldsString});`;
};
export const query = {
  insert,
  update,
  read,
  clear,
  drop,
  count,
  initialQuery,
};
