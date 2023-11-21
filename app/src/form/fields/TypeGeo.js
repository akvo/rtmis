import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { useNavigation, useRoute } from '@react-navigation/native';

import { UIState, FormState, BuildParamsState } from '../../store';
import { FieldLabel } from '../support';
import { styles } from '../styles';
import { loc, i18n } from '../../lib';

const TypeGeo = ({ onChange, values, keyform, id, name, tooltip, required, requiredSign }) => {
  const [errorMsg, setErrorMsg] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [currLocation, setCurrLocation] = useState({ lat: null, lng: null });
  const [loading, setLoading] = useState({ current: false, map: false });
  const currentValues = FormState.useState((s) => s.currentValues);
  const [latitude, longitude] = currentValues?.[id] || [];

  const gpsThreshold = BuildParamsState.useState((s) => s.gpsThreshold);
  const isOnline = UIState.useState((s) => s.online);
  const activeLang = FormState.useState((s) => s.lang);

  const trans = i18n.text(activeLang);

  const navigation = useNavigation();
  const route = useRoute();
  const requiredValue = required ? requiredSign : null;

  const handleOpenMap = () => {
    if (latitude && longitude) {
      const params = { latitude, longitude, id, current_location: currLocation };
      navigation.navigate('MapView', { ...route?.params, ...params });
    } else {
      handleGetCurrLocation(true);
    }
  };

  const handleGetCurrLocation = useCallback(
    async (openMap = false) => {
      const loadingKey = openMap ? 'map' : 'current';
      setLoading({
        ...loading,
        [loadingKey]: true,
      });
      await loc.getCurrentLocation(
        ({ coords }) => {
          const { latitude: lat, longitude: lng, accuracy } = coords;
          /**
           * accuracy number in meters, doc: https://docs.expo.dev/versions/latest/sdk/location/#locationgeocodedlocation
           */
          setGpsAccuracy(Math.floor(accuracy));
          // console.info('GPS accuracy:', accuracy, 'GPS Threshold:', gpsThreshold);
          if ((accuracy <= gpsThreshold && !openMap) || openMap) {
            setCurrLocation({
              lat,
              lng,
            });
            onChange(id, [lat, lng]);
            setLoading({
              ...loading,
              [loadingKey]: false,
            });
          }
          if (openMap) {
            const params = { latitude: lat, longitude: lng, id, current_location: { lat, lng } };
            navigation.navigate('MapView', { ...route?.params, ...params });
          }
        },
        ({ message }) => {
          setLoading({
            ...loading,
            [loadingKey]: false,
          });
          setErrorMsg(message);
        },
      );
    },
    [gpsThreshold],
  );

  useEffect(() => {
    if (gpsAccuracy && gpsAccuracy >= gpsThreshold && loading.current) {
      handleGetCurrLocation(false);
    }
  }, [handleGetCurrLocation, gpsAccuracy, gpsThreshold, loading.current]);

  return (
    <View>
      <FieldLabel keyform={keyform} name={name} tooltip={tooltip} requiredSign={requiredValue} />
      <View style={styles.inputGeoContainer}>
        <View>
          <Text testID="text-lat">
            {trans.latitude}: {latitude}
          </Text>
          <Text testID="text-lng">
            {trans.longitude}: {longitude}
          </Text>
        </View>
        {errorMsg && (
          <Text testID="text-error" style={styles.errorText}>
            {errorMsg}
          </Text>
        )}
        <View style={styles.geoButtonGroup}>
          <Button onPress={() => handleGetCurrLocation(false)} testID="button-curr-location">
            {loading.current ? trans.fetchingLocation : trans.buttonCurrLocation}
          </Button>
          {isOnline && (
            <Button type="outline" onPress={handleOpenMap} testID="button-open-map">
              {loading.map ? trans.loadingText : trans.buttonOpenMap}
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

export default TypeGeo;
