import * as Location from 'expo-location';

const getCurrentLocation = async (success, error, level = null) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') {
    const findLevel = accuracyLevels.find((l) => l.value === level);
    const accuracy = findLevel?.value || Location.Accuracy.Highest;
    const result = await Location.getCurrentPositionAsync({
      accuracy,
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

export const accuracyLevels = [
  {
    label: 'Lowest',
    value: 1,
  },
  {
    label: 'Low',
    value: 2,
  },
  {
    label: 'Balanced',
    value: 3,
  },
  {
    label: 'High',
    value: 4,
  },
  {
    label: 'Highest',
    value: 5,
  },
];
