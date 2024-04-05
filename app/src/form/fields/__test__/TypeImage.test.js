import React from 'react';
import { render, fireEvent, waitFor, act } from 'react-native-testing-library';
import * as ImagePicker from 'expo-image-picker';
import { PermissionsAndroid } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import TypeImage from '../TypeImage';
import { FormState } from '../../../store';

jest.mock('react-native/Libraries/PermissionsAndroid/PermissionsAndroid', () => ({
  PERMISSIONS: {
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    CAMERA: 'android.permission.CAMERA',
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
  check: jest.fn().mockResolvedValue(true),
  request: jest.fn().mockResolvedValue('granted'),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ assets: [{ uri: 'file://example.jpg', base64: 'dummybase64' }] }),
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({ assets: [{ uri: 'file://captured.jpeg', base64: 'dummyCamerabase64' }] }),
  ),
}));
jest.mock('expo-font');
jest.mock('expo-asset');

describe('TypeImage component', () => {
  beforeAll(() => {
    FormState.update((s) => {
      s.lang = 'en';
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly by default', () => {
    const fieldID = 'imageField';
    const mockValues = { [fieldID]: null };
    const mockOnChange = jest.fn();
    const { getByTestId, queryByText, queryByTestId } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
      />,
    );
    const questionText = queryByText('Latrine photo');
    expect(questionText).toBeDefined();

    const buttonUseCamera = getByTestId('btn-use-camera');
    expect(buttonUseCamera).toBeDefined();

    const imagePreview = queryByTestId('image-preview');
    expect(imagePreview).toBeNull();
  });

  it('should render correctly when useGallery is true', () => {
    const fieldID = 'imageField';
    const mockValues = { [fieldID]: null };
    const mockOnChange = jest.fn();
    const { getByTestId, queryByText, queryByTestId } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
        useGallery
      />,
    );
    const questionText = queryByText('Latrine photo');
    expect(questionText).toBeDefined();

    const buttonUseCamera = getByTestId('btn-use-camera');
    expect(buttonUseCamera).toBeDefined();

    const buttonFromGallery = getByTestId('btn-from-gallery');
    expect(buttonFromGallery).toBeDefined();

    const imagePreview = queryByTestId('image-preview');
    expect(imagePreview).toBeNull();
  });

  it('should not ask read storage permission when get image from gallery', async () => {
    const fieldID = 'imageField';
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
    const mockValues = result.current;
    const mockOnChange = jest.fn();
    const { getByTestId, queryByTestId, rerender } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
        useGallery
      />,
    );

    const buttonFromGallery = getByTestId('btn-from-gallery');
    act(() => {
      fireEvent.press(buttonFromGallery);
      FormState.update((s) => {
        s.currentValues = { [fieldID]: 'file://example.jpg' };
      });
    });
    rerender(
      <TypeImage
        onChange={mockOnChange}
        value={result.current?.[fieldID]}
        keyform={1}
        id={fieldID}
        label="Latrine photo"
        useGallery
      />,
    );

    await waitFor(() => {
      expect(PermissionsAndroid.request).not.toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenCalledWith(fieldID, 'file://example.jpg');
      const imagePreview = queryByTestId('image-preview');
      expect(imagePreview).toBeDefined();
      expect(imagePreview.props.source.uri).toBe('file://example.jpg');
    });
  });

  it('should be cancelable when the image set from the gallery', async () => {
    ImagePicker.launchImageLibraryAsync.mockImplementation(() =>
      Promise.resolve({ canceled: true }),
    );

    const fieldID = 'imageField';
    const mockValues = { [fieldID]: null };
    const mockOnChange = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
        useGallery
      />,
    );

    const buttonFromGallery = getByTestId('btn-from-gallery');
    fireEvent.press(buttonFromGallery);

    await act(async () => {
      await ImagePicker.launchImageLibraryAsync();
    });

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      const imagePreview = queryByTestId('image-preview');
      expect(imagePreview).toBeNull();
    });
  });

  it('should ask camera permission when Use Camera button clicked', async () => {
    PermissionsAndroid.check.mockResolvedValueOnce(false);
    const fieldID = 'imageField';
    const mockValues = { [fieldID]: null };
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
      />,
    );

    const buttonUseCamera = getByTestId('btn-use-camera');
    fireEvent.press(buttonUseCamera);
    await act(async () => {
      await PermissionsAndroid.request();
    });

    const mockPermissionAndroindRequest = {
      buttonNegative: 'Cancel',
      buttonNeutral: 'Ask Me Later',
      buttonPositive: 'OK',
      message: 'App needs access to your camera',
      title: 'You need to give storage permission to download and save the file',
    };

    await waitFor(() => {
      expect(PermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        mockPermissionAndroindRequest,
      );
    });
  });

  it('should not ask camera permission when its granted ', async () => {
    const fieldID = 'imageField';
    const mockValues = { [fieldID]: null };
    const mockOnChange = jest.fn();
    const { getByTestId, queryByTestId, rerender } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
      />,
    );

    const buttonUseCamera = getByTestId('btn-use-camera');

    act(() => {
      fireEvent.press(buttonUseCamera);
    });

    rerender(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value="file://captured.jpeg"
        id={fieldID}
        label="Latrine photo"
      />,
    );

    await waitFor(() => {
      expect(PermissionsAndroid.request).not.toHaveBeenCalled();
      expect(PermissionsAndroid.check).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.CAMERA);
      expect(PermissionsAndroid.check).toBeTruthy();
      expect(mockOnChange).toHaveBeenCalledWith(fieldID, 'file://captured.jpeg');

      const imagePreview = queryByTestId('image-preview');
      expect(imagePreview).toBeDefined();
      expect(imagePreview.props.source.uri).toBe('file://captured.jpeg');
    });
  });

  it('should not trigger onChange when camera permission was denied', async () => {
    PermissionsAndroid.check.mockResolvedValueOnce(false);
    PermissionsAndroid.request.mockImplementation(() =>
      Promise.resolve(PermissionsAndroid.RESULTS.DENIED),
    );

    const fieldID = 'imageField';
    const mockValues = { [fieldID]: null };
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
      />,
    );

    const buttonUseCamera = getByTestId('btn-use-camera');
    fireEvent.press(buttonUseCamera);

    let accessStatus = null;
    await act(async () => {
      accessStatus = await PermissionsAndroid.request();
    });

    const mockPermissionAndroindRequest = {
      buttonNegative: 'Cancel',
      buttonNeutral: 'Ask Me Later',
      buttonPositive: 'OK',
      message: 'App needs access to your camera',
      title: 'You need to give storage permission to download and save the file',
    };

    await waitFor(() => {
      expect(PermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        mockPermissionAndroindRequest,
      );
      expect(accessStatus).toEqual(PermissionsAndroid.RESULTS.DENIED);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  it('should be cancelable when capturing image from camera', async () => {
    const fieldID = 'imageField';
    const mockValues = { [fieldID]: null };
    const mockOnChange = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
      />,
    );

    const buttonUseCamera = getByTestId('btn-use-camera');
    fireEvent.press(buttonUseCamera);

    ImagePicker.launchCameraAsync.mockImplementation(() => Promise.resolve({ canceled: true }));

    await act(async () => {
      await ImagePicker.launchCameraAsync();
    });

    await waitFor(() => {
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
      const imagePreview = queryByTestId('image-preview');
      expect(imagePreview).toBeNull();
    });
  });

  it('should be able to remove image', () => {
    const fieldID = 'imageField';
    const mockValues = { [fieldID]: '/images/initial.jpg' };
    const mockOnChange = jest.fn();
    const { getByTestId, queryByTestId, rerender } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
      />,
    );
    const imagePreview = queryByTestId('image-preview');
    expect(imagePreview).toBeDefined();

    const buttonRemove = getByTestId('btn-remove');
    expect(buttonRemove).toBeDefined();
    fireEvent.press(buttonRemove);

    rerender(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={null}
        id={fieldID}
        label="Latrine photo"
      />,
    );

    expect(queryByTestId('image-preview')).toBeNull();
  });

  it('should not show required sign if required param is false and requiredSign is not defined', () => {
    const fieldID = 'imageField';
    const mockValues = { [fieldID]: null };
    const mockOnChange = jest.fn();
    const { queryByTestId } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
        required={false}
      />,
    );

    const requiredIcon = queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should not show required sign if required param is false but requiredSign is defined', () => {
    const fieldID = 'imageField';
    const mockValues = { [fieldID]: null };
    const mockOnChange = jest.fn();
    const { queryByTestId } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
        required={false}
        requiredSign="*"
      />,
    );

    const requiredIcon = queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should show required sign if required param is true and requiredSign defined', () => {
    const fieldID = 'imageField';
    const mockValues = { [fieldID]: null };
    const mockOnChange = jest.fn();
    const { queryByTestId } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
        required
        requiredSign="*"
      />,
    );

    const requiredIcon = queryByTestId('field-required-icon');
    expect(requiredIcon).toBeTruthy();
  });

  it('should show required sign with custom requiredSign', () => {
    const fieldID = 'imageField';
    const mockValues = { [fieldID]: null };
    const mockOnChange = jest.fn();
    const { getByText } = render(
      <TypeImage
        onChange={mockOnChange}
        keyform={1}
        value={mockValues[fieldID]}
        id={fieldID}
        label="Latrine photo"
        required
        requiredSign="**"
      />,
    );

    const requiredIcon = getByText('**');
    expect(requiredIcon).toBeTruthy();
  });
});
