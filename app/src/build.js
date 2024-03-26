// eslint-disable-next-line import/no-unresolved
import { SERVER_URL } from '@env';
import buildJson from './build.json';

const defaultBuildParams = {
  ...buildJson,
  serverURL: SERVER_URL,
};

export default defaultBuildParams;
