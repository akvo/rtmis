import buildJson from './build.json';

const defaultBuildParams = {
  ...buildJson,
  serverURL: 'https://rtmis.akvotest.org/api/v1/device',
  apkURL: 'https://rtmis.akvotest.org/app',
};

export default defaultBuildParams;
