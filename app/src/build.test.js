[warn] --jsx-bracket-same-line is deprecated.
[warn] Ignored unknown option --loglevel=error. Did you mean --log-level?
[warn] Ignored unknown option --stdin.
import { SERVER_URL } from '@env';
import build_json from './build.json';

const defaultBuildParams = {
  ...build_json,
  serverURL: 'https://rtmis.akvotest.org/api/v1/device',
};

export default defaultBuildParams;
