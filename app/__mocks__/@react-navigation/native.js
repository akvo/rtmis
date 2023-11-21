import React from 'react';

const navigation = {
  callbacks: {},
  navigate: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(false),
  setParams: jest.fn(),
  addListener: jest.fn((event, callback) => {
    // Store the callback to call it later with custom data
    navigation.callbacks[event] = callback;
  }),
  dispatch: jest.fn(),
};

export const useNavigation = jest.fn().mockReturnValue(navigation);

// Export the custom function to simulate triggering the 'beforeRemove' event
export const triggerBeforeRemoveEvent = (data) => {
  const callback = navigation.callbacks['beforeRemove'];
  if (callback) {
    // Create a mock event object with preventDefault function
    const mockEvent = { preventDefault: jest.fn(), ...data };
    callback(mockEvent, data);
  }
};

export const useNavigationContainerRef = jest.fn().mockReturnValue({
  navigate: jest.fn(),
});

export const route = {
  params: {},
};

export const useRoute = () => route;

export const MockNavigationProvider = ({ children }) => <React.Fragment>{children}</React.Fragment>;
export const NavigationContainer = ({ children }) => <React.Fragment>{children}</React.Fragment>;
