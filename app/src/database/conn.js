import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

const openDatabase = () => {
  const db = SQLite.openDatabase('db.db');
  return db;
};

const init = openDatabase();

const tx = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (transaction) => {
        if (Array.isArray(query)) {
          const promises = query.map((q) => {
            return new Promise((innerResolve, innerReject) => {
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
            });
          });

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
};

const openDBfile = async (databaseFile, databaseName) => {
  if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
  }
  await FileSystem.downloadAsync(
    Asset.fromModule(databaseFile).uri,
    FileSystem.documentDirectory + `SQLite/${databaseName}.db`,
  );
  return SQLite.openDatabase(`${databaseName}.db`);
};

export const conn = {
  file: (dbFile, dbName) => openDBfile(dbFile, dbName),
  init,
  tx,
};
