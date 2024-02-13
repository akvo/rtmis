import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { conn, query } from '../database';

const DIR_NAME = 'SQLite';

const createSqliteDir = async () => {
  /**
   * Setup sqlite directory to save cascades sqlite from server
   */
  if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + DIR_NAME)).exists) {
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + DIR_NAME);
  }
};

const download = (downloadUrl, fileUrl, update = false) => {
  const fileSql = fileUrl?.split('/')?.pop(); // get last segment as filename
  const pathSql = `${DIR_NAME}/${fileSql}`;
  console.info('Downloading...', downloadUrl);
  FileSystem.getInfoAsync(FileSystem.documentDirectory + pathSql).then(({ exists }) => {
    if (!exists || update) {
      FileSystem.downloadAsync(downloadUrl, FileSystem.documentDirectory + pathSql)
    }
  });
};

const loadDataSource = async (source, id = null) => {
  const { file: cascadeName } = source;
  const db = SQLite.openDatabase(cascadeName);
  const readQuery = id ? query.read('nodes', { id }) : query.read('nodes');
  const readParam = id ? [id] : [];
  const result = await conn.tx(db, readQuery, readParam);
  return result;
};

const dropFiles = async () => {
  const Sqlfiles = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory + DIR_NAME);
  Sqlfiles.forEach(async (file) => {
    if (file.includes('sqlite')) {
      const fileUri = FileSystem.documentDirectory + `${DIR_NAME}/${file}`;
      await FileSystem.deleteAsync(fileUri);
    }
  });
  return Sqlfiles;
};

export default cascades = {
  createSqliteDir,
  loadDataSource,
  download,
  dropFiles,
  DIR_NAME,
};
