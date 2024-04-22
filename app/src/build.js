// eslint-disable-next-line import/no-unresolved
import { SERVER_URL } from '@env';
import buildJson from './build.json';

const defaultBuildParams = {
  ...buildJson,
  serverURL: 'http://192.168.116.145:3000/api/v1/device',
};

export default defaultBuildParams;
