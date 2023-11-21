import * as Location from 'expo-location';
import loc from '../loc';

jest.mock('expo-location');

describe('lib/loc.js', () => {
  test('get current location successfully', () => {
    loc.getCurrentLocation((res) => {
      expect(res).toEqual({
        coords: {
          accuracy: 20,
          latitude: 37.12345,
          longitude: -122.6789,
        },
      });
    });
  });

  it('should handle denied permission', () => {
    const mockRequestDenied = jest.fn().mockImplementation(() => {
      return Promise.resolve({ status: 'denied' });
    });
    Location.requestForegroundPermissionsAsync.mockImplementation(mockRequestDenied);

    loc.getCurrentLocation(null, (err) => {
      expect(err.message).toEqual('Permission to access location was denied');
    });
  });
});
