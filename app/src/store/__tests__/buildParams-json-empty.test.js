import { renderHook } from '@testing-library/react-native';
/**
 * Mock build json is empty and should use the default state
 */
jest.mock('../../build.json', () => ({}));
import BuildParamsState from '../buildParams';

describe('BuildParamsState build.json empty', () => {
  it('should initialize with the correct default state', () => {
    const { result } = renderHook(() => BuildParamsState.useState());
    const {
      authenticationType,
      debugMode,
      dataSyncInterval,
      errorHandling,
      loggingLevel,
      appVersion,
    } = result.current;
    expect(authenticationType).toEqual(['code_assignment', 'username', 'password']);
    expect(debugMode).toBe(false);
    expect(dataSyncInterval).toBe(300);
    expect(errorHandling).toBe(true);
    expect(loggingLevel).toBe('verbose');
    expect(appVersion).toBe('1.0.0');
  });
});
