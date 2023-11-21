export const createNativeStackNavigator = jest.fn().mockReturnValue({
  Navigator: jest.fn().mockReturnValue(null),
  Screen: jest.fn().mockReturnValue(null),
  // Add other methods or properties you need to mock
});
