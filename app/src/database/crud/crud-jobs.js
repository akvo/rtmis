import * as Crypto from 'expo-crypto';
import { conn, query } from '../';
import crudUsers from './crud-users';

const db = conn.init;

export const jobStatus = {
  PENDING: 1,
  ON_PROGRESS: 2,
  SUCCESS: 3,
  FAILED: 4,
};

export const MAX_ATTEMPT = 3;

const tableName = 'jobs';
const jobsQuery = () => {
  return {
    getActiveJob: async (type) => {
      try {
        const session = await crudUsers.getActiveUser();
        if (session?.id) {
          /**
           * Make sure the app only gets active jobs from current user
           */
          const where = { active: 1, type, user: session.id };
          const nocase = false;
          const order_by = 'createdAt';
          const readQuery = query.read(tableName, where, nocase, order_by);
          const { rows } = await conn.tx(db, readQuery, [1, type, session.id]);
          if (!rows.length) {
            return null;
          }
          return rows._array[0];
        }
        return null;
      } catch {
        return null;
      }
    },
    addJob: async (data = {}) => {
      try {
        const createdAt = new Date().toISOString()?.replace('T', ' ')?.split('.')?.[0] || null;
        const insertQuery = query.insert(tableName, {
          ...data,
          createdAt,
          uuid: Crypto.randomUUID(), // TODO: Remove if not needed
        });
        return await conn.tx(db, insertQuery, []);
      } catch (error) {
        return null;
      }
    },
    updateJob: async (id, data) => {
      try {
        const updateQuery = query.update(tableName, { id }, { ...data });
        return await conn.tx(db, updateQuery, [id]);
      } catch {
        return null;
      }
    },
    deleteJob: async (id) => {
      try {
        const deleteQuery = `DELETE FROM ${tableName} WHERE id = ?`;
        return await conn.tx(db, deleteQuery, [id]);
      } catch {
        return null;
      }
    },
  };
};

const crudJobs = jobsQuery();

export default crudJobs;
