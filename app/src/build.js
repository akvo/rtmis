// eslint-disable-next-line import/no-unresolved
import { SERVER_URL, APK_URL } from '@env';
import buildJson from './build.json';

const defaultBuildParams = {
  ...buildJson,
  serverURL: SERVER_URL,
  apkURL: APK_URL,
};

export default defaultBuildParams;
