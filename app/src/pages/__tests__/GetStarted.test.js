import React from 'react';
import renderer from 'react-test-renderer';
import { render, act, fireEvent, renderHook } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import GetStartedPage from '../GetStarted';
import { BuildParamsState } from '../../store';

describe('GetStartedPage', () => {
  test('renders correctly', () => {
    act(() => {
      BuildParamsState.update((s) => {
        s.serverURL = null;
        s.authenticationType = ['code_assignment', 'username', 'password'];
      });
    });

    const tree = renderer.create(<GetStartedPage />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders correctly with serverURL and without code_assignment', () => {
    act(() => {
      BuildParamsState.update((s) => {
        s.serverURL = 'https://example.com';
        s.authenticationType = ['username', 'password'];
      });
    });

    render(<GetStartedPage />);
  });

  test('it changed server url', () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    act(() => {
      BuildParamsState.update((s) => {
        s.serverURL = null;
        s.authenticationType = ['code_assignment', 'username', 'password'];
      });
    });

    const { getByTestId } = render(<GetStartedPage navigation={navigation} />);
    const serverField = getByTestId('server-url-field');
    expect(serverField).toBeDefined();

    const getStartedButton = getByTestId('get-started-button');
    expect(getStartedButton).toBeDefined();

    fireEvent.changeText(serverField, 'https://www.example.com');
    fireEvent.press(getStartedButton);
    expect(BuildParamsState.getRawState().serverURL).toBe('https://www.example.com');
  });
});
