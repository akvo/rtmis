import React, { useState } from 'react';
import { View, PermissionsAndroid, StyleSheet, ActivityIndicator } from 'react-native';
import { Image, Button, Dialog } from '@rneui/themed';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { FieldLabel } from '../support';
import { FormState } from '../../store';
import { i18n } from '../../lib';

const TypeImage = ({
  onChange,
  keyform,
  id,
  values,
  name,
  tooltip,
  required,
  requiredSign,
  useGallery = false,
}) => {
  const [selectedImage, setSelectedImage] = useState(values?.[id]);
  const activeLang = FormState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const requiredValue = required ? requiredSign : null;

  const handleOnChange = (dataResult) => {
    const { uri: imageUri } = dataResult.assets[0];
    /**
     * Property fileName is only available for iOS
     * docs: https://docs.expo.dev/versions/latest/sdk/imagepicker/#imagepickerasset
     */
    onChange(id, imageUri);
    setSelectedImage(imageUri);
  };

  const selectFile = async () => {
    /**
     * No permissions request is necessary for launching the image library
     * Docs: https://docs.expo.dev/versions/latest/sdk/imagepicker/#usage
     */
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      base64: true,
    });
    if (!result?.canceled) {
      handleOnChange(result);
    }
  };

  const handleCamera = async () => {
    const isCameraGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
    let accessGranted = isCameraGranted;
    if (!isCameraGranted) {
      const askCameraPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: trans.imageStoragePerm,
          message: trans.imageCameraPerm,
          buttonNeutral: trans.imageAskLater,
          buttonNegative: trans.buttonCancel,
          buttonPositive: trans.buttonOk,
        },
      );
      if (askCameraPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        accessGranted = false;
      }
    }
    if (accessGranted) {
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        base64: true,
      });
      if (!result?.canceled) {
        handleOnChange(result);
      }
    }
  };

  return (
    <View>
      <FieldLabel keyform={keyform} name={name} tooltip={tooltip} requiredSign={requiredValue} />
      <View style={styles.fieldImageContainer}>
        <Button type="outline" onPress={handleCamera} testID="btn-use-camera">
          <Icon name="camera" size={18} color="dodgerblue" />
          {` ${trans.buttonUseCamera}`}
        </Button>
        {useGallery && (
          <Button type="outline" onPress={selectFile} testID="btn-from-gallery">
            <Icon name="image" size={18} color="dodgerblue" />
            {` ${trans.buttonFromGallery}`}
          </Button>
        )}
        {selectedImage && typeof selectedImage === 'string' && (
          <View>
            <Image
              source={{ uri: selectedImage }}
              style={styles.imagePreview}
              PlaceholderContent={<ActivityIndicator />}
              testID="image-preview"
            />
            <Button
              containerStyle={styles.buttonRemoveFile}
              title={trans.buttonRemove}
              color="secondary"
              onPress={() => setSelectedImage(null)}
              disabled={!selectedImage}
              testID="btn-remove"
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default TypeImage;

const styles = StyleSheet.create({
  fieldImageContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  imagePreview: { width: '100%', height: 200, resizeMode: 'contain' },
  buttonRemoveFile: {
    paddingVertical: 8,
  },
});
