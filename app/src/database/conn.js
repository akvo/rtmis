import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

const openDatabase = () => {
  const db = SQLite.openDatabase('db.db');
  return db;
};

const init = openDatabase();

const tx = (db, query, params = []) =>
  new Promise((resolve, reject) => {
    db.transaction(
      (transaction) => {
        if (Array.isArray(query)) {
          const promises = query.map(
            (q) =>
              new Promise((innerResolve, innerReject) => {
                transaction.executeSql(
                  q,
                  params,
                  (_, resultSet) => {
                    innerResolve(resultSet);
                  },
                  (_, error) => {
                    innerReject(error);
                    return false; // Rollback the transaction
                  },
                );
              }),
          );

          Promise.all(promises)
            .then((results) => {
              resolve(results);
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          transaction.executeSql(
            query,
            params,
            (_, resultSet) => {
              resolve(resultSet);
            },
            (_, error) => {
              reject(error);
              return false; // Rollback the transaction
            },
          );
        }
      },
      (error) => {
        reject(error);
      },
    );
  });

const openDBfile = async (databaseFile, databaseName) => {
  if (!(await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite`)).exists) {
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`);
  }
  await FileSystem.downloadAsync(
    Asset.fromModule(databaseFile).uri,
    `${FileSystem.documentDirectory}SQLite/${databaseName}.db`,
  );
  return SQLite.openDatabase(`${databaseName}.db`);
};

const removeDB = async () => {
  try {
    const { exists } = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite/db.db`);
    if (exists) {
      /**
       * Check user session before deletion
       */
      const db = openDatabase('db.db');
      const { rows } = await tx(db, 'SELECT * FROM users where active = ?', [1]);
      if (rows.length === 0) {
        /**
         * @tutorial https://docs.expo.dev/versions/latest/sdk/filesystem/#filesystemdeleteasyncfileuri-options
         * Reset all databases inside the SQLite folder (the directory and all its contents are recursively deleted).
         */
        await FileSystem.deleteAsync(`${FileSystem.documentDirectory}SQLite`);
        return true;
      }
    }
    return false;
  } catch (error) {
    return Promise.reject(error);
  }
};

const conn = {
  file: (dbFile, dbName) => openDBfile(dbFile, dbName),
  reset: () => removeDB(),
  init,
  tx,
};

export default conn;
