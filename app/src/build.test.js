import buildJson from './build.json';

const defaultBuildParams = {
  ...buildJson,
  serverURL: 'https://rtmis.akvotest.org/api/v1/device',
};

it('should at least one test', () => {
  expect(defaultBuildParams.serverURL).toEqual('https://rtmis.akvotest.org/api/v1/device');
});

export default defaultBuildParams;
