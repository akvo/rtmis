import React from 'react';
import renderer from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import ManageFormPage from '../ManageForm';
import { FormState } from '../../store/';

jest.mock('@react-navigation/native');

describe('ManageFormPage', () => {
  beforeAll(() => {
    FormState.update((s) => {
      s.form = {
        id: 1,
        name: 'Example Form',
        draft: 0,
        submitted: 1,
      };
    });
  });

  test('renders correctly', () => {
    const tree = renderer.create(<ManageFormPage />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should navigate to FormPage with correct route params', () => {
    const mockNavigation = useNavigation();
    const mockParams = {
      params: {
        id: 1,
        name: 'Health Facilities',
        newSubmission: true,
      },
    };
    const { getByTestId } = render(
      <ManageFormPage navigation={mockNavigation} route={mockParams} />,
    );

    const listItemEl = getByTestId('goto-item-0');
    expect(listItemEl).toBeDefined();
    fireEvent.press(listItemEl);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('FormPage', mockParams.params);
  });

  it('should navigate to FormPage with (Edit Saved) correct route params', () => {
    const mockNavigation = useNavigation();
    const mockParams = {
      params: {
        id: 1,
        monitoring: true,
        name: 'Health Facilities',
        showSubmitted: false,
        newSubmission: true,
      },
    };
    const { getByTestId } = render(
      <ManageFormPage navigation={mockNavigation} route={mockParams} />,
    );

    const listItemEl = getByTestId('goto-item-1');
    expect(listItemEl).toBeDefined();
    fireEvent.press(listItemEl);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('UpdateForm', mockParams.params);
  });

  it('should navigate to FormData (View Submitted) with correct route params', () => {
    const mockNavigation = useNavigation();
    const mockParams = {
      params: {
        id: 1,
        monitoring: true,
        name: 'Health Facilities',
        showSubmitted: false,
        newSubmission: true,
      },
    };
    const { getByTestId } = render(
      <ManageFormPage navigation={mockNavigation} route={mockParams} />,
    );

    const listItemEl = getByTestId('goto-item-2');
    expect(listItemEl).toBeDefined();
    fireEvent.press(listItemEl);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('FormData', mockParams.params);
  });
});
