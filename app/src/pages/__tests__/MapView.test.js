import React, { useState } from 'react';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { act, render, renderHook, waitFor, fireEvent } from '@testing-library/react-native';
import mockBackHandler from 'react-native/Libraries/Utilities/__mocks__/BackHandler.js';

import MapView from '../MapView';
import { FormState } from '../../store';
import { loc } from '../../lib';

const loadHtml = require('map.html');

const htmlData = `${loadHtml}`;

jest.useFakeTimers();

jest.mock('@react-navigation/native');

jest.mock('expo-location');

jest.mock('expo-asset', () => ({
    Asset: {
      loadAsync: jest.fn(() => Promise.resolve([{ localUri: 'mocked-uri' }])),
    },
  }));

jest.mock('expo-file-system', () => ({
    readAsStringAsync: jest.fn(() => Promise.resolve(htmlData)),
  }));

jest.mock('react-native/Libraries/Utilities/BackHandler', () => mockBackHandler);

const mockSelectedForm = {
  id: 1,
  name: 'Health Facilities',
};

describe('MapView', () => {
  beforeAll(() => {
    // update FormState to store selectedForm
    act(() => {
      FormState.update((s) => {
        s.form = mockSelectedForm;
      });
    });
  });
  it('should render html on webview correctly', async () => {
    const route = {
      params: {
        lat: 123,
        lng: -456,
      },
    };

    const { getByTestId } = render(<MapView route={route} />);
    const { result: resultState } = renderHook(() => useState());

    const [htmlContent, setHtmlContent] = resultState.current;

    await act(async () => {
      const [{ localUri }] = await Asset.loadAsync(require('../../assets/map.html'));
      const fileContents = await FileSystem.readAsStringAsync(localUri);
      const { latitude: lat, longitude: lng } = route?.params;
      setHtmlContent(fileContents);
    });

    await waitFor(() => {
      const webEl = getByTestId('webview-map');
      expect(webEl).toBeDefined();
      const htmlFromWebView = webEl.props.source.html;
      expect(htmlFromWebView).toBe(htmlData);
    });
  });

  it('should use current location when the button clicked', async () => {
    const curr_lat = 36.12345;
    const curr_lng = -122.6789;
    const route = {
      params: {
        current_location: { lat: curr_lat, lng: curr_lng },
        lat: 37.12345,
        lng: -122.6789,
      },
    };

    const mockNavigation = useNavigation();
    const { getByTestId } = render(<MapView route={route} navigation={mockNavigation} />);
    const { result: resMapState } = renderHook(() => FormState.useState((s) => s.currentValues));

    const buttonEl = getByTestId('button-get-current-loc');
    expect(buttonEl).toBeDefined();
    fireEvent.press(buttonEl);

    act(() => {
      FormState.update((s) => {
        s.currentValues = {
          ...s.currentValues,
          geoField: [curr_lat, curr_lng],
        };
      });
    });

    await waitFor(() => {
      const { geoField } = resMapState.current;
      const [latitude, longitude] = geoField || {};

      expect(latitude).toBe(curr_lat);
      expect(longitude).toBe(curr_lng);
    });
  });

  it('should back to the FormPage screen along with params when back hardware pressed', async () => {
    const route = {
      params: {
        lat: 37.12345,
        lng: -122.6789,
      },
    };
    const navigation = useNavigation();
    navigation.canGoBack.mockReturnValue(true);
    expect(navigation.canGoBack()).toEqual(true);

    render(<MapView route={route} navigation={navigation} />);

    act(() => {
      const handleBackPress = () => {
        navigation.navigate('FormPage', mockSelectedForm);
        return true;
      };
      const backHandler = mockBackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => {
        backHandler.remove();
      };
    }, []);

    act(() => {
      mockBackHandler.mockPressBack();
    });

    await waitFor(() => {
      const { result } = renderHook(() => FormState.useState());
      const { form: formSelected } = result.current;
      expect(formSelected).toBe(mockSelectedForm);
      expect(navigation.navigate).toHaveBeenCalledWith('FormPage', mockSelectedForm);
    });
  });

  it('should get values from selected location', async () => {
    const route = {
      params: {
        lat: 37.12345,
        lng: -122.6789,
        id: 12,
      },
    };
    const mockNavigation = useNavigation();

    const { getByTestId } = render(<MapView route={route} navigation={mockNavigation} />);
    const { result } = renderHook(() => useState({ lat: null, lng: null }));
    const { result: resultVisible } = renderHook(() => useState(false));

    const [markerData, setMarkerData] = result.current;
    const [visible, setVisible] = resultVisible.current;
    const webViewEl = getByTestId('webview-map');
    // Mock the data that will be passed in the onMessage event
    const mockMarkerData = { lat: route.params.lat, lng: route.params.lng, distance: 21 };
    const mockEventData = JSON.stringify({ type: 'markerClicked', data: mockMarkerData });

    // Trigger the onMessage event
    fireEvent(webViewEl, 'onMessage', {
      nativeEvent: { data: mockEventData },
    });

    const buttonEl = getByTestId('button-selected-loc');
    expect(buttonEl).toBeDefined();
    fireEvent.press(buttonEl);

    act(() => {
      setMarkerData({
        lat: 36.12345,
        lng: -122.6789,
      });
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual({
        lat: 36.12345,
        lng: -122.6789,
      });
      expect(mockNavigation.navigate).toHaveBeenCalledWith('FormPage', mockSelectedForm);
    });
  });
});
