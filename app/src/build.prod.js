import buildJson from './build.json';

const defaultBuildParams = {
  ...buildJson,
  serverURL: 'https://rush.health.go.ke/api/v1/device',
  apkURL: 'https://rush.health.go.ke/app',
};

export default defaultBuildParams;
