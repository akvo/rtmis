/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Text, Button } from '@rneui/themed';
import PropTypes from 'prop-types';

import { FormState, BuildParamsState, UserState } from '../../store';
import { FieldLabel } from '../support';
import styles from '../styles';
import { loc, i18n } from '../../lib';

const TypeGeo = ({ keyform, id, label, value, tooltip, required, requiredSign, disabled }) => {
  const [errorMsg, setErrorMsg] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [loading, setLoading] = useState(false);
  const latitude = value?.[0] || null;
  const longitude = value?.[1] || null;

  const gpsAccuracyLevel = BuildParamsState.useState((s) => s.gpsAccuracyLevel);
  const geoLocationTimeout = BuildParamsState.useState((s) => s.geoLocationTimeout);
  const gpsThreshold = BuildParamsState.useState((s) => s.gpsThreshold);
  const activeLang = FormState.useState((s) => s.lang);
  const savedLocation = UserState.useState((s) => s.currentLocation);

  const trans = i18n.text(activeLang);

  const requiredValue = required ? requiredSign : null;

  const getCurrentLocation = async () => {
    await loc.getCurrentLocation(
      ({ coords }) => {
        const { latitude: lat, longitude: lng, accuracy } = coords;
        /**
         * accuracy number in meters, doc: https://docs.expo.dev/versions/latest/sdk/location/#locationgeocodedlocation
         */
        setGpsAccuracy(Math.floor(accuracy));

        FormState.update((s) => {
          s.currentValues = { ...s.currentValues, [id]: [lat, lng] };
        });
        setLoading(false);
      },
      ({ message }) => {
        setLoading(false);
        setErrorMsg(message);
        setGpsAccuracy(-1);

        FormState.update((s) => {
          s.currentValues = { ...s.currentValues, [id]: [-1.3855559, 37.9938594] };
        });
      },
      gpsAccuracyLevel,
    );
  };

  const handleGetCurrLocation = async () => {
    const geoTimeout = geoLocationTimeout * 1000;
    setLoading(true);
    setTimeout(() => {
      if (!value?.length && savedLocation?.coords) {
        /**
         * Insert a saved location when a GEO question has no answer after timeout
         */
        const { latitude: lat, longitude: lng, accuracy } = savedLocation.coords;
        setGpsAccuracy(Math.floor(accuracy));
        FormState.update((s) => {
          s.currentValues = { ...s.currentValues, [id]: [lat, lng] };
        });
      }
      if (loading) {
        setLoading(false);
      }
    }, geoTimeout);
    await getCurrentLocation();
  };

  return (
    <View>
      <FieldLabel keyform={keyform} name={label} tooltip={tooltip} requiredSign={requiredValue} />
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
                    : 'High Precision'
                  : gpsAccuracy < gpsThreshold
                  ? 'Moderate Precision'
                  : 'Low Precision'}
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
            disabled={disabled}
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

TypeGeo.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.array]),
  keyform: PropTypes.number.isRequired,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.object,
  required: PropTypes.bool.isRequired,
  requiredSign: PropTypes.string,
  disabled: PropTypes.bool,
};

TypeGeo.defaultProps = {
  value: '',
  requiredSign: '*',
  disabled: false,
  tooltip: null,
};
