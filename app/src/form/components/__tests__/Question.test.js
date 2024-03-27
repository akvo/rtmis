import React from 'react';
import { act, render, renderHook, waitFor, fireEvent } from '@testing-library/react-native';
import * as Crypto from 'expo-crypto';
import { View } from 'react-native';
import Question from '../Question';
import { FormState } from '../../../store';

// According to the issue on @testing-library/react-native
jest.spyOn(View.prototype, 'measureInWindow').mockImplementation((cb) => {
  cb(18, 113, 357, 50);
});
jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  useField: jest.fn().mockReturnValue([{}, {}, { setTouched: jest.fn() }]),
}));
const uuidv4 = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
// Mock the entire 'expo-crypto' module
jest.mock('expo-crypto', () => ({
  ...jest.requireActual('expo-crypto'), // Use the actual module for all other exports
  randomUUID: jest.fn(),
}));

const isValidUUIDv4 = (str) => {
  // UUIDv4 pattern
  const uuidv4Pattern =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  // Test the input string against the pattern
  return uuidv4Pattern.test(str);
};

describe('Question component', () => {
  beforeAll(() => {
    /**
     * Set default UUID value
     */
    Crypto.randomUUID.mockImplementation(() => uuidv4);
  });
  beforeEach(() => {
    FormState.update((s) => {
      s.currentValues = {};
    });
  });

  it('should render question list correctly', () => {
    const mockGroupQuestions = {
      label: 'Register',
      question: [
        {
          id: 1,
          label: 'Your Email',
          order: 1,
          type: 'input',
          required: true,
          meta: true,
          translations: [],
        },
        {
          id: 2,
          label: 'Your Name',
          order: 2,
          type: 'input',
          required: true,
          meta: false,
          translations: [],
        },
      ],
    };

    const { getAllByTestId, queryByText } = render(<Question group={mockGroupQuestions} />);

    const questionView = getAllByTestId('question-view');
    expect(questionView).toBeDefined();
    expect(questionView.length).toEqual(2);
    const q1 = queryByText('1. Your Email');
    expect(q1).not.toBeNull();
  });

  it('should execute generate UUID when the meta_uuid is exists', async () => {
    const mockGroupQuestions = {
      label: 'Register',
      question: [
        {
          id: 1,
          label: 'UUID',
          order: 1,
          type: 'input',
          required: true,
          meta: false,
          translations: [],
          meta_uuid: true,
        },
      ],
    };

    const { getAllByTestId, queryByText, getByTestId } = render(
      <Question group={mockGroupQuestions} index={0} />,
    );

    act(() => {
      FormState.update((s) => {
        s.currentValues = { 1: uuidv4 };
      });
    });

    await waitFor(() => {
      const questionView = getAllByTestId('question-view');
      expect(questionView).toBeDefined();
      expect(questionView.length).toEqual(1);
      const q1 = queryByText('1. UUID');
      expect(q1).not.toBeNull();
      const inputElement = getByTestId('type-input');
      expect(inputElement.props.value).toEqual(uuidv4);
    });
  });

  it("should not execute generate UUID when the meta_uuid doesn't exists", () => {
    const mockGroupQuestions = {
      label: 'Register',
      question: [
        {
          id: 1,
          label: 'Your Email',
          order: 1,
          type: 'input',
          required: true,
          meta: true,
          translations: [],
        },
      ],
    };

    const setFieldValue = jest.fn();

    const { getAllByTestId, queryByText, getByTestId } = render(
      <Question group={mockGroupQuestions} />,
    );
    const questionView = getAllByTestId('question-view');
    expect(questionView).toBeDefined();
    expect(questionView.length).toEqual(1);
    const q1 = queryByText('1. Your Email');
    expect(q1).not.toBeNull();

    expect(setFieldValue).toHaveBeenCalledTimes(0);
    const inputElement = getByTestId('type-input');
    expect(inputElement.props.value).toBeNull();
  });

  it('should store valid uuidv4', async () => {
    const mockGroupQuestions = {
      label: 'Register',
      question: [
        {
          id: 1,
          label: 'UUID',
          order: 1,
          type: 'input',
          required: true,
          meta: false,
          translations: [],
          meta_uuid: true,
        },
      ],
    };

    const { getByTestId, rerender } = render(<Question group={mockGroupQuestions} />);

    act(() => {
      FormState.update((s) => {
        s.currentValues = { 1: uuidv4 };
      });
    });

    rerender(<Question group={mockGroupQuestions} />);

    await waitFor(() => {
      const inputElement = getByTestId('type-input');
      expect(inputElement.props.value).toEqual(uuidv4);

      const inputVal = inputElement.props.value;
      const isValid = isValidUUIDv4(inputVal);
      expect(isValid).toBeTruthy();
    });
  });

  it('should store existing generated UUID', async () => {
    const mockGroupQuestions = {
      label: 'Register',
      question: [
        {
          id: 1,
          label: 'UUID',
          order: 1,
          type: 'input',
          required: true,
          meta: false,
          translations: [],
          meta_uuid: true,
        },
      ],
    };
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));

    const { getByTestId } = render(<Question group={mockGroupQuestions} index={0} />);
    /**
     * Generate new one
     */
    const newUUID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    Crypto.randomUUID.mockImplementation(() => newUUID);

    await waitFor(() => {
      expect(Crypto.randomUUID()).toEqual(newUUID);

      const inputElement = getByTestId('type-input');
      expect(inputElement.props.value).not.toEqual(newUUID);
      /**
       * Equal with the previous one
       */
      expect(inputElement.props.value).toEqual(uuidv4);

      expect(result.current).toEqual({ 1: uuidv4 });
    });
  });

  it('should handle prefilled in number type of question', async () => {
    const mockGroupQuestions = {
      label: 'Register',
      question: [
        {
          id: 1,
          label: 'Your Age',
          name: 'your_age',
          order: 1,
          type: 'number',
          required: true,
          meta: true,
          translations: [],
        },
        {
          id: 2,
          label: 'Last Education',
          name: 'last_education',
          order: 2,
          type: 'option',
          required: false,
          meta: false,
          translations: [],
          option: [
            {
              id: 11,
              label: 'Senior High School',
              value: 'senior_high_school',
              order: 1,
            },
            {
              id: 12,
              label: 'Bachelor',
              value: 'bachelor',
              order: 2,
            },
            {
              id: 13,
              label: 'Master',
              value: 'master',
              order: 3,
            },
            {
              id: 14,
              label: 'Doctor',
              value: 'doctor',
              order: 4,
            },
          ],
          pre: {
            your_age: {
              18: ['senior_high_school'],
            },
          },
        },
      ],
    };
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));

    const { getByTestId, getByText } = render(<Question group={mockGroupQuestions} />);

    act(() => {
      fireEvent.changeText(getByTestId('type-number'), '18');
    });

    await waitFor(() => {
      const inputElement = getByTestId('type-number');
      expect(inputElement.props.value).toEqual('18');
      expect(getByText('Senior High School')).toBeDefined();

      expect(result.current).toEqual({ 1: '18', 2: ['senior_high_school'] });
    });
  });

  it('should handle prefilled in option type of question', async () => {
    const mockGroupQuestions = {
      label: 'Register',
      question: [
        {
          id: 1,
          label: 'Are you willing to participate in the survey?',
          name: 'willing_to_survey',
          order: 1,
          type: 'option',
          required: true,
          meta: true,
          translations: [],
          option: [
            {
              id: 11,
              value: 'Yes',
              label: 'Yes',
              order: 1,
            },
            {
              id: 12,
              value: 'No',
              label: 'No',
              order: 2,
            },
          ],
        },
        {
          id: 2,
          label: 'Your Point',
          name: 'your_point',
          order: 2,
          type: 'number',
          required: false,
          meta: false,
          translations: [],
          option: null,
          pre: {
            willing_to_survey: {
              Yes: 10,
            },
          },
        },
      ],
    };
    const { result } = renderHook(() => FormState.useState((s) => s.currentValues));

    const { getByTestId, getByText, rerender } = render(<Question group={mockGroupQuestions} />);

    const optionEl = getByTestId('type-option-dropdown');
    fireEvent.press(optionEl);

    const choosedOpt = getByText('Yes');
    await waitFor(() => expect(choosedOpt).toBeDefined());

    fireEvent.press(choosedOpt);

    rerender(<Question group={mockGroupQuestions} />);

    await waitFor(() => {
      expect(result.current).toEqual({ 1: ['Yes'], 2: 10 });
    });
  });
});
