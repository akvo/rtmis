import { Store } from 'pullstate';
import defaultBuildParams from '../build';

const BuildParamsState = new Store({
  authenticationType: defaultBuildParams?.authenticationType || [
    'code_assignment',
    'username',
    'password',
  ],
  serverURL: defaultBuildParams?.serverURL,
  debugMode: defaultBuildParams?.debugMode || false,
  dataSyncInterval: defaultBuildParams?.dataSyncInterval || 3600,
  errorHandling: defaultBuildParams?.errorHandling || true,
  loggingLevel: defaultBuildParams?.loggingLevel || 'verbose',
  appVersion: defaultBuildParams?.appVersion || '1.0.0',
  gpsThreshold: defaultBuildParams?.gpsThreshold || 20, // meters
  gpsInterval: 5, // seconds
});

export default BuildParamsState;
