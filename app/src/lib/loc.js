import * as Location from 'expo-location';

const getCurrentLocation = async (success, error) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') {
    const result = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    success(result);
  } else {
    error({
      message: 'Permission to access location was denied',
    });
  }
};

const loc = {
  getCurrentLocation,
};

export default loc;
