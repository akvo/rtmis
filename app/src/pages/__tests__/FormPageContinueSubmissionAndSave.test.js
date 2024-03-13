import React from 'react';
import { Platform, ToastAndroid } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import FormPage from '../FormPage';
import crudDataPoints from '../../database/crud/crud-datapoints';
import { UserState, FormState } from '../../store';
import { getCurrentTimestamp } from '../../form/lib';

jest.useFakeTimers();

const mockFormContainer = jest.fn();
const mockRoute = {
  params: { id: 1, name: 'Form Name', dataPointId: 1, newSubmission: false },
};
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};
const mockValues = {
  name: 'John Doe',
  answers: {
    1: 'John Doe',
    2: new Date('01-01-1992'),
    3: '31',
    4: ['Male'],
    5: ['Bachelor'],
    6: ['Traveling'],
    7: ['Fried Rice'],
  },
};
const mockOnSave = jest.fn();
const mockCurrentDataPoint = {
  id: 1,
  form: 1,
  user: 1,
  name: 'John',
  submitted: 0,
  duration: 0,
  createdAt: null,
  submittedAt: new Date().toISOString(),
  syncedAt: null,
  json: {
    1: 'John',
    2: new Date('01-01-1992'),
    3: '31',
    4: ['Male'],
    5: ['Bachelor'],
    6: ['Traveling'],
    7: ['Fried Rice'],
  },
};

jest.mock('../../database/crud/crud-datapoints');
jest.mock('../../form/FormContainer', () => function({ forms, initialValues, onSubmit, onSave }) {
  mockFormContainer(forms, initialValues, onSubmit, onSave);
  return (
    <mock-FormContainer>
      <button onPress={() => mockOnSave(mockValues)} testID="mock-save-button-helper">
        Save Trigger helper
      </button>
      <button onPress={() => onSubmit(mockValues)} testID="mock-submit-button">
        Submit
      </button>
    </mock-FormContainer>
  );
});

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useMemo: jest.fn(),
}));

describe('FormPage continue saved submision then save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1634123456789);
    FormState.update((s) => {
      s.surveyDuration = 0;
    });
  });

  test('should call handleOnSaveAndExit with the correct values when Save & Exit button pressed', async () => {
    Platform.OS = 'android';
    ToastAndroid.show = jest.fn();
    crudDataPoints.selectDataPointById.mockImplementation(() =>
      Promise.resolve(mockCurrentDataPoint),
    );

    const mockSetOnSaveFormParams = jest.fn();
    const mockOnSaveFormParams = { values: mockValues };
    jest
      .spyOn(React, 'useState')
      .mockImplementation(() => [mockOnSaveFormParams, mockSetOnSaveFormParams]);

    const mockSetShowDialogMenu = jest.fn();
    jest.spyOn(React, 'useState').mockImplementation(() => [true, mockSetShowDialogMenu]);
    act(() => {
      FormState.update((s) => {
        s.surveyStart = getCurrentTimestamp();
      });
    });

    const wrapper = render(<FormPage navigation={mockNavigation} route={mockRoute} />);

    act(() => {
      UserState.update((s) => {
        s.id = 1;
      });
    });

    const arrowBackButton = wrapper.queryByTestId('arrow-back-button');
    expect(arrowBackButton).toBeTruthy();
    fireEvent.press(arrowBackButton);

    const dialogMenuElement = wrapper.queryByTestId('save-dialog-menu');
    await waitFor(() => {
      expect(dialogMenuElement.props.visible).toEqual(true);
    });

    const saveButtonElement = wrapper.queryByTestId('save-and-exit-button');
    expect(saveButtonElement).toBeTruthy();
    fireEvent.press(saveButtonElement);

    await waitFor(() => {
      expect(crudDataPoints.saveDataPoint).not.toHaveBeenCalled();
      expect(crudDataPoints.updateDataPoint).toHaveBeenCalledWith({
        duration: 1,
        form: 1,
        json: {},
        name: 'Untitled',
        submitted: 0,
        user: null,
      });
      expect(ToastAndroid.show).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Home', mockRoute.params);
    });
  });

  test('should show ToastAndroid if handleOnSaveAndExit throw an error', async () => {
    Platform.OS = 'android';
    ToastAndroid.show = jest.fn();
    crudDataPoints.selectDataPointById.mockImplementation(() =>
      Promise.resolve(mockCurrentDataPoint),
    );
    const consoleErrorSpy = jest.spyOn(console, 'error');
    crudDataPoints.updateDataPoint.mockImplementation(() => Promise.reject('Error'));

    const mockSetOnSaveFormParams = jest.fn();
    const mockOnSaveFormParams = { values: mockValues };
    jest
      .spyOn(React, 'useState')
      .mockImplementation(() => [mockOnSaveFormParams, mockSetOnSaveFormParams]);

    const mockSetShowDialogMenu = jest.fn();
    jest.spyOn(React, 'useState').mockImplementation(() => [true, mockSetShowDialogMenu]);

    act(() => {
      UserState.update((s) => {
        s.id = 1;
      });
    });

    const wrapper = render(<FormPage navigation={mockNavigation} route={mockRoute} />);

    const arrowBackButton = wrapper.queryByTestId('arrow-back-button');
    expect(arrowBackButton).toBeTruthy();
    fireEvent.press(arrowBackButton);

    const dialogMenuElement = wrapper.queryByTestId('save-dialog-menu');
    await waitFor(() => {
      expect(dialogMenuElement.props.visible).toEqual(true);
    });

    const saveButtonElement = wrapper.queryByTestId('save-and-exit-button');
    expect(saveButtonElement).toBeTruthy();
    fireEvent.press(saveButtonElement);

    await waitFor(() => {
      expect(crudDataPoints.saveDataPoint).not.toHaveBeenCalled();
      expect(crudDataPoints.updateDataPoint).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(ToastAndroid.show).toHaveBeenCalled();
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });
});
