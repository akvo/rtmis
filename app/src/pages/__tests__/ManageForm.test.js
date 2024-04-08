import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import ManageFormPage from '../ManageForm';
import { FormState, UserState } from '../../store';

jest.mock('@react-navigation/native');

describe('ManageFormPage', () => {
  beforeAll(() => {
    FormState.update((s) => {
      s.form = {
        id: 1,
        name: 'Example Form',
        draft: 0,
        submitted: 1,
        json: '{ "submission_types": [1, 2] }',
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
        submission_type: 'registration',
      },
    };
    const { getByTestId } = render(
      <ManageFormPage navigation={mockNavigation} route={mockParams} />,
    );

    const listItemEl = getByTestId('goto-item-1');
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
      },
    };
    const { getByTestId } = render(
      <ManageFormPage navigation={mockNavigation} route={mockParams} />,
    );

    const listItemEl = getByTestId('goto-item-3');
    expect(listItemEl).toBeDefined();
    fireEvent.press(listItemEl);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('FormData', mockParams.params);
  });

  it('should navigate to FormData (View Submitted) with correct route params', () => {
    const mockNavigation = useNavigation();
    const mockParams = {
      params: {
        id: 1,
        monitoring: true,
        name: 'Health Facilities',
        showSubmitted: true,
      },
    };
    const { getByTestId } = render(
      <ManageFormPage navigation={mockNavigation} route={mockParams} />,
    );

    const listItemEl = getByTestId('goto-item-4');
    expect(listItemEl).toBeDefined();
    fireEvent.press(listItemEl);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('FormData', mockParams.params);
  });

  it('should navigate to UpdateForm (Verification) when its available', async () => {
    act(() => {
      FormState.update((s) => {
        s.form = {
          id: 1,
          name: 'Example Form',
          draft: 1,
          submitted: 1,
          json: '{ "submission_types": [1, 2, 3] }',
        };
      });
    });

    const mockNavigation = useNavigation();
    const mockParams = {
      params: {
        id: 1,
        name: 'Health Facilities',
        newSubmission: true,
        submission_type: 'verification',
      },
    };
    const { getByTestId } = render(
      <ManageFormPage navigation={mockNavigation} route={mockParams} />,
    );

    const listItemEl = getByTestId('goto-item-5');
    expect(listItemEl).toBeDefined();
    fireEvent.press(listItemEl);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('UpdateForm', mockParams.params);
    });
  });

  it.failing('should not show Certification menu if requirement match', async () => {
    // UserState certification not defined
    act(() => {
      FormState.update((s) => {
        s.form = {
          id: 1,
          name: 'Example Form',
          draft: 1,
          submitted: 1,
          json: '{ "submission_types": [1, 2, 3, 4] }',
        };
      });
    });

    const mockNavigation = useNavigation();
    const mockParams = {
      params: {
        id: 1,
        name: 'Health Facilities',
        newSubmission: true,
        submission_type: 'certification',
      },
    };
    const { getByTestId } = render(
      <ManageFormPage navigation={mockNavigation} route={mockParams} />,
    );

    const certificationMenu = getByTestId('goto-item-6');
    expect(certificationMenu).toBeDefined();
  });

  it('should show Certification menu if requirement match', async () => {
    // Define UserState certification
    act(() => {
      UserState.update((s) => {
        s.id = 1;
        s.name = 'John Doe';
        s.certifications = [12345];
      });

      FormState.update((s) => {
        s.form = {
          id: 1,
          name: 'Example Form',
          draft: 1,
          submitted: 1,
          json: '{ "submission_types": [1, 2, 3, 4] }',
        };
      });
    });

    const mockNavigation = useNavigation();
    const mockParams = {
      params: {
        id: 1,
        name: 'Health Facilities',
        newSubmission: true,
        submission_type: 'certification',
      },
    };
    const { getByTestId } = render(
      <ManageFormPage navigation={mockNavigation} route={mockParams} />,
    );

    const certificationMenu = getByTestId('goto-item-6');
    expect(certificationMenu).toBeDefined();
  });
});
