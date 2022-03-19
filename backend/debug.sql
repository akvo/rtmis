-- SHOW LEVELS
SELECT a.* from form a;
SELECT * FROM system_user;

-- SHOW APPROVER
SELECT
  pa.*,
  a.name,
  a.path,
  u.email,
  CONCAT(u.first_name, ' ', u.last_name) as name
FROM
  pending_data_approval pa
  LEFT JOIN batch b ON pa.batch_id = b.id
  LEFT JOIN system_user u ON u.id = pa.user_id
  LEFT JOIN access ac ON u.id = ac.user_id
  LEFT JOIN administrator a ON ac.administration_id = a.id
ORDER BY
  a.id DESC;

-- SHOW APPROVER MORE DETAILS
SELECT DISTINCT
  pa.batch_id,
  pa.user_id,
  CONCAT(u.first_name, ' ', u.last_name) as name,
  pa.level_id as level,
  l.name as level_name,
  CASE
       WHEN pa.status = 1 THEN 'Pending'
       WHEN pa.status = 2 THEN 'Approved'
  END status,
  CASE
       WHEN COALESCE(max(pa2.level_id), 0) > pa.level_id THEN 'Subordinate'
       WHEN COALESCE(max(pa2.level_id), 0) = pa.level_id THEN 'My Pending'
       WHEN COALESCE(max(pa2.level_id), 0) < pa.level_id THEN 'Approved'
  END ok
FROM
  pending_data_approval pa
  LEFT JOIN system_user u ON pa.user_id = u.id
  LEFT JOIN levels l ON l.id = pa.level_id
  LEFT JOIN (
      SELECT * FROM pending_data_approval pda
      WHERE pda.status = 1) as pa2 ON pa2.batch_id = pa.batch_id
GROUP BY pa.id, l.id, u.id
ORDER BY pa.batch_id

-- ANSWERS
SELECT a.data_id, a.question_id, d.form_id, array_agg(o) as answers
FROM answer a
LEFT JOIN data d ON a.data_id = d.id
CROSS JOIN jsonb_array_elements_text(a.options) as o
WHERE a.options IS NOT NULL
GROUP BY a.data_id, a.question_id, d.form_id;

-- ADVANCED SEARCH QUERY
SELECT *
FROM (
    SELECT
    d.form_id,
    a.data_id,
    d.administration_id,
    array_agg(CONCAT(q.id, '|', LOWER(o), '')) as options
    FROM
        answer a
        LEFT JOIN question q on q.id = a.question_id
        LEFT JOIN data d on d.id = a.data_id
        CROSS JOIN jsonb_array_elements_text(a.options) as o
    WHERE a.options IS NOT NULL
    GROUP BY a.data_id, d.form_id, d.administration_id
) AS source
WHERE options @> '{"444670046|yes"}'
