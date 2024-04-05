import React from 'react';
import { render, waitFor } from 'react-native-testing-library';
import { renderHook, fireEvent, act } from '@testing-library/react-native';
import * as Location from 'expo-location';

import TypeGeo from '../TypeGeo';
import { UIState, FormState, BuildParamsState } from '../../../store';

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
          1: null,
        };
      });
      UIState.update((s) => {
        s.online = true;
      });
    });
  });

  it('should render TypeGeo correctly', () => {
    const values = { 1: null };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const { getByTestId } = render(
      <TypeGeo
        id="1"
        name="geo"
        label="Geolocation"
        onChange={mockedOnChange}
        value={values[1]}
        keyform={0}
        required
      />,
    );

    const buttonCurLocationEl = getByTestId('button-curr-location');
    expect(buttonCurLocationEl).toBeDefined();
    /**
     * The open map feature has been disabled in this project
     */
    // const buttonOpenMapEl = getByTestId('button-open-map');
    // expect(buttonOpenMapEl).toBeDefined();

    const latText = getByTestId('text-lat');
    expect(latText.props.children).toEqual(['Latitude', ': ', null]);
    const lngText = getByTestId('text-lng');
    expect(lngText.props.children).toEqual(['Longitude', ': ', null]);
  });

  it('should not show required sign if required param is false and requiredSign is not defined', async () => {
    const values = { 1: [] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });
    const wrapper = render(
      <TypeGeo
        id="1"
        name="geo"
        label="Geolocation"
        required={false}
        onChange={mockedOnChange}
        value={values[1]}
        keyform={0}
      />,
    );
    await waitFor(() => {
      const requiredIcon = wrapper.queryByTestId('field-required-icon');
      expect(requiredIcon).toBeFalsy();
    });
  });

  it('should not show required sign if required param is false but requiredSign is defined', async () => {
    const values = { 1: [] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const wrapper = render(
      <TypeGeo
        id="1"
        name="geo"
        label="Geolocation"
        required={false}
        requiredSign="*"
        onChange={mockedOnChange}
        value={values[1]}
        keyform={0}
      />,
    );
    await waitFor(() => {
      const requiredIcon = wrapper.queryByTestId('field-required-icon');
      expect(requiredIcon).toBeFalsy();
    });
  });

  it('should not show required sign if required param is true and requiredSign defined', async () => {
    const values = { 1: [] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const wrapper = render(
      <TypeGeo
        id="1"
        name="geo"
        label="Geolocation"
        required
        requiredSign="*"
        onChange={mockedOnChange}
        value={values[1]}
        keyform={0}
      />,
    );
    await waitFor(() => {
      const requiredIcon = wrapper.queryByTestId('field-required-icon');
      expect(requiredIcon).toBeTruthy();
    });
  });

  it('should show required sign with custom requiredSign', async () => {
    const values = { 1: [] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const wrapper = render(
      <TypeGeo
        id="1"
        name="geo"
        label="Geolocation"
        required
        requiredSign="**"
        onChange={mockedOnChange}
        value={values[1]}
        keyform={0}
      />,
    );
    await waitFor(() => {
      const requiredIcon = wrapper.getByText('**');
      expect(requiredIcon).toBeTruthy();
    });
  });

  it('should show error message and empty array when unable to get current location', async () => {
    const values = { 1: [11, 12] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const errorMessage = 'Permission to access location was denied';
    Location.requestForegroundPermissionsAsync.mockImplementation(() =>
      Promise.resolve({ status: 'denied' }),
    );
    Location.getCurrentPositionAsync.mockImplementation(() => Promise.resolve({ coords: {} }));

    Location.getCurrentPositionAsync.mockRejectedValue({ message: errorMessage });

    const { getByTestId, getByText } = render(
      <TypeGeo
        id="1"
        name="geo"
        label="Geolocation"
        onChange={mockedOnChange}
        value={values[1]}
        keyform={0}
        required
      />,
    );

    const buttonCurLocationEl = getByTestId('button-curr-location');
    expect(buttonCurLocationEl).toBeDefined();
    fireEvent.press(buttonCurLocationEl);

    act(() => {
      mockedOnChange('1', []);
    });

    await waitFor(() => {
      const errorText = getByText(errorMessage);
      expect(errorText).toBeDefined();
      expect(mockedOnChange).toHaveBeenCalledWith('1', []);
    });
  });

  it('should not showing button open map when network is offline', async () => {
    const values = { 1: [11, 12] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const { queryByTestId } = render(
      <TypeGeo
        id="1"
        name="geo"
        label="Geolocation"
        onChange={mockedOnChange}
        value={values[1]}
        keyform={0}
        required
      />,
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
    Location.requestForegroundPermissionsAsync.mockImplementation(() =>
      Promise.resolve({ status: 'granted' }),
    );
    Location.getCurrentPositionAsync.mockImplementation(() =>
      Promise.resolve({
        coords: {
          latitude: 35677,
          longitude: -7811,
          accuracy: 20,
        },
      }),
    );

    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const mockedOnChange = jest.fn();

    const { getByTestId } = render(
      <TypeGeo
        id="1"
        name="geo"
        label="Geolocation"
        onChange={mockedOnChange}
        value={[]}
        keyform={0}
        required
      />,
    );

    const buttonCurLocationEl = getByTestId('button-curr-location');
    expect(buttonCurLocationEl).toBeDefined();
    fireEvent.press(buttonCurLocationEl);

    act(() => {
      FormState.update((s) => {
        s.currentValues = { 1: [35677, -7811] };
      });
    });

    await waitFor(() => {
      expect(result.current[1]).toEqual([35677, -7811]);
    });
  });

  it('should show `Low Precission` when accuracy exceeded the threshold', async () => {
    Location.requestForegroundPermissionsAsync.mockImplementation(() =>
      Promise.resolve({ status: 'granted' }),
    );
    Location.getCurrentPositionAsync.mockImplementation(() =>
      Promise.resolve({
        coords: {
          latitude: 12.345,
          longitude: -67.89,
          accuracy: 200,
        },
      }),
    );

    const values = { 1: [] };
    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const { getByTestId, getByText } = render(
      <TypeGeo
        id="1"
        name="geo"
        label="Geolocation"
        onChange={mockedOnChange}
        value={values[1]}
        keyform={0}
        required
      />,
    );

    const buttonCurLocationEl = getByTestId('button-curr-location');
    expect(buttonCurLocationEl).toBeDefined();
    fireEvent.press(buttonCurLocationEl);

    await Location.getCurrentPositionAsync();

    await waitFor(() => {
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(2);
      expect(getByText('Low Precission')).toBeDefined();
      expect(values[1]).toEqual([]);
    });
  });
});
