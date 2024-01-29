import { SERVER_URL } from '@env';
import build_json from './build.json';

const defaultBuildParams = {
  ...build_json,
  serverURL: 'https://rtmis.akvotest.org/api/v1/device',
};

export default defaultBuildParams;
