import React, { useState } from 'react';
import { render, waitFor } from 'react-native-testing-library';
import { renderHook, fireEvent, act } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

import TypeGeo from '../TypeGeo';
import { UIState, FormState, BuildParamsState } from '../../../store';
import { loc } from '../../../lib';

jest.mock('expo-location');

jest.mock('@react-navigation/native');

describe('TypeGeo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      BuildParamsState.update((s) => {
        s.gpsThreshold = 20;
      });
      FormState.update((s) => {
        s.currentValues = {
          geoField: null,
        };
      });
      UIState.update((s) => {
        s.online = true;
      });
    });
  });

  it('should render TypeGeo correctly', () => {
    const values = { geoField: null };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const { getByTestId } = render(
      <TypeGeo id="geoField" name="Geolocation" onChange={mockedOnChange} values={values} />,
    );

    const buttonCurLocationEl = getByTestId('button-curr-location');
    expect(buttonCurLocationEl).toBeDefined();
    const buttonOpenMapEl = getByTestId('button-open-map');
    expect(buttonOpenMapEl).toBeDefined();

    const latText = getByTestId('text-lat');
    expect(latText.props.children).toEqual(['Latitude', ': ']);
    const lngText = getByTestId('text-lng');
    expect(lngText.props.children).toEqual(['Longitude', ': ']);
  });

  it('should not show required sign if required param is false and requiredSign is not defined', async () => {
    const values = { geoField: [] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });
    const wrapper = render(
      <TypeGeo
        id="geoField"
        name="Geolocation"
        required={false}
        onChange={mockedOnChange}
        values={values}
      />,
    );
    await waitFor(() => {
      const requiredIcon = wrapper.queryByTestId('field-required-icon');
      expect(requiredIcon).toBeFalsy();
    });
  });

  it('should not show required sign if required param is false but requiredSign is defined', async () => {
    const values = { geoField: [] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const wrapper = render(
      <TypeGeo
        id="geoField"
        name="Geolocation"
        required={false}
        requiredSign="*"
        onChange={mockedOnChange}
        values={values}
      />,
    );
    await waitFor(() => {
      const requiredIcon = wrapper.queryByTestId('field-required-icon');
      expect(requiredIcon).toBeFalsy();
    });
  });

  it('should not show required sign if required param is true and requiredSign defined', async () => {
    const values = { geoField: [] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const wrapper = render(
      <TypeGeo
        id="geoField"
        name="Geolocation"
        required={true}
        requiredSign="*"
        onChange={mockedOnChange}
        values={values}
      />,
    );
    await waitFor(() => {
      const requiredIcon = wrapper.queryByTestId('field-required-icon');
      expect(requiredIcon).toBeTruthy();
    });
  });

  it('should show required sign with custom requiredSign', async () => {
    const values = { geoField: [] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const wrapper = render(
      <TypeGeo
        id="geoField"
        name="Geolocation"
        required={true}
        requiredSign="**"
        onChange={mockedOnChange}
        values={values}
      />,
    );
    await waitFor(() => {
      const requiredIcon = wrapper.getByText('**');
      expect(requiredIcon).toBeTruthy();
    });
  });

  it('should set empty object when getting current location failed', async () => {
    const values = { geoField: [11, 12] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const errorMessage = 'Permission to access location was denied';
    Location.requestForegroundPermissionsAsync.mockImplementation(() => {
      return Promise.resolve({ status: 'denied' });
    });
    Location.getCurrentPositionAsync.mockImplementation(() => {
      return Promise.resolve({ coords: {} });
    });

    Location.getCurrentPositionAsync.mockRejectedValue({ message: errorMessage });

    const { getByTestId, getByText } = render(
      <TypeGeo id="geoField" name="Geolocation" onChange={mockedOnChange} values={values} />,
    );
    const { result } = renderHook(() => useState());
    const [errorMsg, setErrorMsg] = result.current;

    const buttonCurLocationEl = getByTestId('button-curr-location');
    expect(buttonCurLocationEl).toBeDefined();
    fireEvent.press(buttonCurLocationEl);

    act(() => {
      mockedOnChange('geoField', []);
      setErrorMsg(errorMessage);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(errorMessage);
      const errorText = getByText(errorMessage);
      expect(errorText).toBeDefined();
    });
  });

  it('should not showing button open map when network is offline', async () => {
    const values = { geoField: [11, 12] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const { queryByTestId } = render(
      <TypeGeo id="geoField" name="Geolocation" onChange={mockedOnChange} values={values} />,
    );
    const { result } = renderHook(() => UIState.useState());

    act(() => {
      UIState.update((s) => {
        s.online = false;
      });
    });

    await waitFor(() => {
      const openButton = queryByTestId('button-open-map');
      expect(openButton).toBeNull();
      expect(result.current.online).toBe(false);
    });
  });

  it('should get current location by clicking the button', async () => {
    Location.requestForegroundPermissionsAsync.mockImplementation(() => {
      return Promise.resolve({ status: 'granted' });
    });
    Location.getCurrentPositionAsync.mockImplementation(() => {
      return Promise.resolve({
        coords: {
          latitude: 35677,
          longitude: -7811,
          accuracy: 20,
        },
      });
    });

    const values = { geoField: [] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const { getByTestId } = render(
      <TypeGeo id="geoField" name="Geolocation" onChange={mockedOnChange} values={values} />,
    );

    const buttonCurLocationEl = getByTestId('button-curr-location');
    expect(buttonCurLocationEl).toBeDefined();
    fireEvent.press(buttonCurLocationEl);

    await waitFor(() => {
      expect(values.geoField).toEqual([35677, -7811]);
    });
  });

  it('should get current location and redirect to MapView when open map clicked', async () => {
    const mockNavigation = useNavigation();
    const { getByTestId, getByText, debug } = render(
      <TypeGeo
        onChange={() => jest.fn()}
        values={{ geoField: null }}
        id="geoField"
        name="Geolocation"
        navigation={mockNavigation}
      />,
    );

    const buttonCurrLoc = getByTestId('button-open-map');
    expect(buttonCurrLoc).toBeDefined();
    fireEvent.press(buttonCurrLoc);

    act(() => {
      loc.getCurrentLocation(({ coords }) => {
        FormState.update((s) => {
          s.currentValues = {
            ...s.currentValues,
            geoField: [coords.latitude, coords.longitude],
          };
        });
      });
    });
    await waitFor(() => {
      const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
      const { geoField } = result.current;
      const [latitude, longitude] = geoField || {};

      expect(mockNavigation.navigate).toHaveBeenCalledWith('MapView', {
        current_location: {
          lat: 35677,
          lng: -7811,
        },
        id: 'geoField',
        latitude,
        longitude,
      });
    });
  });

  it('should open open map directly without fetching location when lat,long already exists', async () => {
    const latitude = 37.1234;
    const longitude = -112.6789;
    Location.getCurrentPositionAsync.mockImplementation(() => {
      return Promise.resolve({
        coords: {
          latitude,
          longitude,
          accuracy: 20,
        },
      });
    });

    const mockNavigation = useNavigation();
    const { getByTestId, getByText, debug } = render(
      <TypeGeo
        onChange={() => jest.fn()}
        values={{ geoField: null }}
        id="geoField"
        name="Geolocation"
        navigation={mockNavigation}
      />,
    );
    act(() => {
      loc.getCurrentLocation(({ coords }) => {
        FormState.update((s) => {
          s.currentValues = {
            ...s.currentValues,
            geoField: [coords.latitude, coords.longitude],
          };
        });
      });
    });

    const buttonCurrLoc = getByTestId('button-open-map');
    expect(buttonCurrLoc).toBeDefined();
    fireEvent.press(buttonCurrLoc);

    const mockGetCurrentLocation = jest.fn();

    await waitFor(() => {
      expect(mockGetCurrentLocation).toHaveBeenCalledTimes(0);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('MapView', {
        current_location: {
          lat: latitude,
          lng: longitude,
        },
        id: 'geoField',
        latitude,
        longitude,
      });
    });
  });

  it('should loop fetching location when accuracy exceeded the threshold', async () => {
    Location.requestForegroundPermissionsAsync.mockImplementation(() => {
      return Promise.resolve({ status: 'granted' });
    });
    Location.getCurrentPositionAsync.mockImplementation(() => {
      return Promise.resolve({
        coords: {
          latitude: 12.345,
          longitude: -67.89,
          accuracy: 200,
        },
      });
    });

    const values = { geoField: [] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const { getByTestId, getByText, rerender } = render(
      <TypeGeo id="geoField" name="Geolocation" onChange={mockedOnChange} values={values} />,
    );

    const buttonCurLocationEl = getByTestId('button-curr-location');
    expect(buttonCurLocationEl).toBeDefined();
    fireEvent.press(buttonCurLocationEl);

    const mockGetCurrentLocation = jest.fn();

    await Location.getCurrentPositionAsync();

    await waitFor(() => {
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(2);
      expect(getByText('Fetching location...')).toBeDefined();
      expect(values.geoField).toEqual([]);
    });
  });
});
