/* eslint-disable no-undef */
jest.mock('@sentry/react-native', () => ({
  init: () => jest.fn(),
  wrap: (node) => jest.fn(node),
  ReactNativeTracing: () => jest.fn(),
  ReactNavigationInstrumentation: (node) => jest.fn(node),
  captureMessage: (msg) => jest.fn(msg),
  captureException: (e) => jest.fn(e),
}));
