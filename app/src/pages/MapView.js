import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { Button } from '@rneui/themed';
import PropTypes from 'prop-types';
import { FormState, UIState } from '../store';
import { i18n } from '../lib';

const MapView = ({ navigation, route }) => {
  const {
    latitude: latParam,
    longitude: lngParam,
    id: questionID,
    current_location: currentLocation,
  } = route.params;
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [markerData, setMarkerData] = useState({
    lat: latParam,
    lng: lngParam,
  });
  const webViewRef = useRef(null);
  const selectedForm = FormState.useState((s) => s.form);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  const goBack = () => {
    navigation.navigate('FormPage', {
      id: selectedForm?.id,
      name: selectedForm?.name,
      ...route?.params,
    });
  };

  const handleCurrentLocation = () => {
    setMarkerData(currentLocation);
    FormState.update((s) => {
      s.currentValues = {
        ...s.currentValues,
        [questionID]: [currentLocation.lat, currentLocation.lng],
      };
    });
    const eventData = JSON.stringify({
      type: 'changeMarker',
      data: currentLocation,
    });
    webViewRef.current.postMessage(eventData);
    goBack();
  };

  const loadHtml = useCallback(async () => {
    // eslint-disable-next-line global-require
    const [{ localUri }] = await Asset.loadAsync(require('../../assets/map.html'));
    const fileContents = await FileSystem.readAsStringAsync(localUri);
    const htmlContents = fileContents
      .replace(/{{latitude}}/g, latParam)
      .replace(/{{longitude}}/g, lngParam);
    setHtmlContent(htmlContents);
  }, [latParam, lngParam]);

  const handleUseSelectedLocation = () => {
    const { lat, lng } = markerData;
    FormState.update((s) => {
      s.currentValues = {
        ...s.currentValues,
        [questionID]: [lat, lng],
      };
    });
    goBack();
  };

  useEffect(() => {
    loadHtml();
  }, [loadHtml]);

  useEffect(() => {
    if (loading && htmlContent) {
      setLoading(false);
    }
  }, [loading, htmlContent]);

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator />}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.map}
        onMessage={(event) => {
          const messageData = JSON.parse(event.nativeEvent.data);
          if (messageData.type === 'markerClicked') {
            setMarkerData(messageData.data);
          }
        }}
        testID="webview-map"
      />
      <View style={styles.buttonContainer}>
        <Button onPress={handleCurrentLocation} testID="button-get-current-loc">
          {trans.buttonCurrLocation}
        </Button>
        <Button onPress={handleUseSelectedLocation} type="outline" testID="button-selected-loc">
          {trans.buttonSelectedLoc}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 8,
  },
});

export default MapView;

MapView.propTypes = {
  route: PropTypes.object,
};

MapView.defaultProps = {
  route: null,
};
