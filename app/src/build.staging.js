import buildJson from './build.json';

const defaultBuildParams = {
  ...buildJson,
  serverURL: 'https://rtmis.akvo.org/api/v1/device',
  apkURL: 'https://rtmis.akvo.org/app',
};

export default defaultBuildParams;
