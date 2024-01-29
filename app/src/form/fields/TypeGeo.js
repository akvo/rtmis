import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { Text, Button } from '@rneui/themed';

import { UIState, FormState, BuildParamsState } from '../../store';
import { FieldLabel } from '../support';
import { styles } from '../styles';
import { loc, i18n } from '../../lib';

const TypeGeo = ({ keyform, id, name, value, tooltip, required, requiredSign }) => {
  const [errorMsg, setErrorMsg] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [currLocation, setCurrLocation] = useState({ lat: null, lng: null });
  const [loading, setLoading] = useState(false);
  const [latitude, longitude] = value || [];

  const gpsThreshold = BuildParamsState.useState((s) => s.gpsThreshold);
  const isOnline = UIState.useState((s) => s.online);
  const activeLang = FormState.useState((s) => s.lang);

  const trans = i18n.text(activeLang);

  const requiredValue = required ? requiredSign : null;

  const handleGetCurrLocation = useCallback(async () => {
    setLoading(true);
    await loc.getCurrentLocation(
      ({ coords }) => {
        const { latitude: lat, longitude: lng, accuracy } = coords;
        /**
         * accuracy number in meters, doc: https://docs.expo.dev/versions/latest/sdk/location/#locationgeocodedlocation
         */
        setGpsAccuracy(Math.floor(accuracy));
        // console.info('GPS accuracy:', accuracy, 'GPS Threshold:', gpsThreshold);
        setCurrLocation({
          lat,
          lng,
        });
        FormState.update((s) => {
          s.currentValues = { ...s.currentValues, [id]: [lat, lng] };
        });
        setLoading(false);
      },
      ({ message }) => {
        setLoading(false);
        setErrorMsg(message);
        setGpsAccuracy(-1);
        setCurrLocation({ lat: -1.3855559, lng: 37.9938594 });
        FormState.update((s) => {
          s.currentValues = { ...s.currentValues, [id]: [-1.3855559, 37.9938594] };
        });
      },
    );
  }, [gpsThreshold, id]);

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
          {gpsAccuracy ? (
            <Text testID="text-acc">
              Accuracy:{' '}
              <Text style={{ color: gpsAccuracy && gpsAccuracy > gpsThreshold ? 'red' : 'green' }}>
                {gpsAccuracy < 10
                  ? gpsAccuracy < 0
                    ? 'GPS is off'
                    : 'High Precission'
                  : gpsAccuracy < gpsThreshold
                  ? 'Moderate Precission'
                  : 'Low Precission'}
              </Text>
            </Text>
          ) : null}
        </View>
        {errorMsg && (
          <Text testID="text-error" style={styles.errorText}>
            {errorMsg}
          </Text>
        )}
        <View style={styles.geoButtonGroup}>
          <Button
            onPress={() => handleGetCurrLocation()}
            testID="button-curr-location"
            disabled={loading}
          >
            {loading
              ? trans.fetchingLocation
              : gpsAccuracy !== null
              ? trans.buttonRefreshCurrLocation
              : trans.buttonCurrLocation}
          </Button>
        </View>
      </View>
    </View>
  );
};

export default TypeGeo;
