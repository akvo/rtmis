import React from 'react';
import { render, fireEvent, waitFor } from 'react-native-testing-library';
import FormNavigation from '../FormNavigation';
import { Platform, ToastAndroid } from 'react-native';

jest.mock("expo-font");
jest.mock("expo-asset");

describe('FormNavigation component', () => {
  it('renders form navigation correctly', async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const setActiveGroup = jest.fn();
    const onSubmit = jest.fn();

    const { getByTestId, getByText, queryByTestId } = render(
      <FormNavigation
        currentGroup={null}
        formRef={null}
        activeGroup={0}
        setActiveGroup={setActiveGroup}
        onSubmit={onSubmit}
        totalGroup={2}
      />,
    );

    const btnBack = getByTestId('form-nav-btn-back');
    expect(btnBack).toBeDefined();

    const groupCounter = getByTestId('form-nav-group-count');
    expect(groupCounter).toBeDefined();
    expect(getByText('1/2')).toBeDefined();

    const btnNext = getByTestId('form-nav-btn-next');
    expect(btnNext).toBeDefined();

    const btnSubmit = queryByTestId('form-btn-submit');
    expect(btnSubmit).toBeNull();
  });

  test('clicking Next should increment activeGroup if not on the last group', async () => {
    const setActiveGroup = jest.fn();
    const onSubmit = jest.fn();

    const { getByTestId } = render(
      <FormNavigation
        currentGroup={null}
        formRef={null}
        activeGroup={0}
        setActiveGroup={setActiveGroup}
        onSubmit={onSubmit}
        totalGroup={2}
      />,
    );

    const btnNext = getByTestId('form-nav-btn-next');
    fireEvent.press(btnNext);
    await waitFor(() => {
      expect(setActiveGroup).toHaveBeenCalledWith(1);
    });
  });

  test('clicking Submit should call onSubmit if on the last group', async () => {
    const setActiveGroup = jest.fn();
    const onSubmit = jest.fn();
    const mockSetShowQuestionGroupList = jest.fn();

    const { getByTestId, getByText, queryByTestId } = render(
      <FormNavigation
        currentGroup={null}
        formRef={null}
        activeGroup={1}
        setActiveGroup={setActiveGroup}
        onSubmit={onSubmit}
        totalGroup={2}
        setShowQuestionGroupList={mockSetShowQuestionGroupList}
      />,
    );

    const groupCounter = getByTestId('form-nav-group-count');
    expect(groupCounter).toBeDefined();
    expect(getByText('2/2')).toBeDefined();

    const btnNext = queryByTestId('form-nav-btn-next');
    expect(btnNext).toBeNull();

    const btnSubmit = getByTestId('form-btn-submit');
    expect(btnSubmit).toBeDefined();
    fireEvent.press(btnSubmit);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('should disable Back and Next button when QuestionGroupList showed', () => {
    const wrapper = render(
      <FormNavigation showQuestionGroupList={true} activeGroup={0} totalGroup={2} />,
    );

    const btnNext = wrapper.queryByTestId('form-nav-btn-next');
    expect(btnNext).toBeTruthy();
    expect(btnNext.props.accessibilityState.disabled).toEqual(true);

    const btnBack = wrapper.queryByTestId('form-nav-btn-back');
    expect(btnBack).toBeTruthy();
    expect(btnBack.props.accessibilityState.disabled).toEqual(true);
  });

  it('should not disable Submit button when QuestionGroupList showed', () => {
    const wrapper = render(
      <FormNavigation showQuestionGroupList={true} activeGroup={1} totalGroup={2} />,
    );

    const submitButton = wrapper.queryByTestId('form-btn-submit');
    expect(submitButton).toBeTruthy();
    expect(submitButton.props.accessibilityState.disabled).toEqual(false);
  });

  it('should call validateOnFormNavigation and not call setActiveGroup if validation error', async () => {
    const mockSetActiveGroup = jest.fn();
    const mockFormRef = {
      current: {
        setTouched: jest.fn(),
        validateForm: jest.fn(() => Promise.resolve(true)),
        errors: [1],
      },
    };

    const { getByTestId } = render(
      <FormNavigation
        formRef={mockFormRef}
        activeGroup={1}
        setActiveGroup={mockSetActiveGroup}
        totalGroup={3}
      />,
    );

    const nextButton = getByTestId('form-nav-btn-next');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(mockFormRef.current.setTouched).toHaveBeenCalledTimes(1);
      expect(mockFormRef.current.validateForm).toHaveBeenCalledTimes(1);
      expect(mockSetActiveGroup).toHaveBeenCalledTimes(0);
    });
  });

  it('should call validateOnFormNavigation and call setActiveGroup if no validation error', async () => {
    const mockSetActiveGroup = jest.fn();
    const mockFormRef = {
      current: {
        setTouched: jest.fn(),
        validateForm: jest.fn(() => Promise.resolve(true)),
        errors: [],
      },
    };

    const { getByTestId } = render(
      <FormNavigation
        formRef={mockFormRef}
        activeGroup={1}
        setActiveGroup={mockSetActiveGroup}
        totalGroup={3}
      />,
    );

    const nextButton = getByTestId('form-nav-btn-next');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(mockFormRef.current.setTouched).toHaveBeenCalledTimes(1);
      expect(mockFormRef.current.validateForm).toHaveBeenCalledTimes(1);
      expect(mockSetActiveGroup).toHaveBeenCalledTimes(1);
    });
  });

  it('should call validateOnFormNavigation and not call onSubmit if validation error', async () => {
    const mockOnSubmit = jest.fn();
    const mockFormRef = {
      current: {
        setTouched: jest.fn(),
        validateForm: jest.fn(() => Promise.resolve(true)),
        errors: [1],
      },
    };

    const { getByTestId } = render(
      <FormNavigation
        formRef={mockFormRef}
        activeGroup={2}
        onSubmit={mockOnSubmit}
        totalGroup={3}
      />,
    );

    const submitButton = getByTestId('form-btn-submit');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockFormRef.current.setTouched).toHaveBeenCalledTimes(1);
      expect(mockFormRef.current.validateForm).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledTimes(0);
    });
  });

  it('should call validateOnFormNavigation and call onSubmit if no validation error', async () => {
    const mockOnSubmit = jest.fn();
    const mockFormRef = {
      current: {
        setTouched: jest.fn(),
        validateForm: jest.fn(() => Promise.resolve(true)),
        errors: [],
      },
    };

    const { getByTestId } = render(
      <FormNavigation
        formRef={mockFormRef}
        activeGroup={2}
        onSubmit={mockOnSubmit}
        totalGroup={3}
      />,
    );

    const submitButton = getByTestId('form-btn-submit');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockFormRef.current.setTouched).toHaveBeenCalledTimes(1);
      expect(mockFormRef.current.validateForm).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('should show Toast notification if validation error when press Next button', async () => {
    Platform.OS = 'android';
    ToastAndroid.show = jest.fn();

    const mockFormRef = {
      current: {
        setTouched: jest.fn(),
        validateForm: jest.fn(() => Promise.resolve(true)),
        errors: [1],
      },
    };

    const { getByTestId } = render(
      <FormNavigation
        formRef={mockFormRef}
        activeGroup={1}
        setActiveGroup={() => jest.fn()}
        totalGroup={3}
      />,
    );

    const nextButton = getByTestId('form-nav-btn-next');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(mockFormRef.current.setTouched).toHaveBeenCalledTimes(1);
      expect(mockFormRef.current.validateForm).toHaveBeenCalledTimes(1);
      expect(ToastAndroid.show).toHaveBeenCalledTimes(1);
    });
  });

  it('should not show Toast notification if no validation error when press Next button', async () => {
    Platform.OS = 'android';
    ToastAndroid.show = jest.fn();

    const mockFormRef = {
      current: {
        setTouched: jest.fn(),
        validateForm: jest.fn(() => Promise.resolve(true)),
        errors: [],
      },
    };

    const { getByTestId } = render(
      <FormNavigation
        formRef={mockFormRef}
        activeGroup={1}
        setActiveGroup={() => jest.fn()}
        totalGroup={3}
      />,
    );

    const nextButton = getByTestId('form-nav-btn-next');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(mockFormRef.current.setTouched).toHaveBeenCalledTimes(1);
      expect(mockFormRef.current.validateForm).toHaveBeenCalledTimes(1);
      expect(ToastAndroid.show).toHaveBeenCalledTimes(0);
    });
  });

  it('should show Toast notification if validation error when press Submit button', async () => {
    Platform.OS = 'android';
    ToastAndroid.show = jest.fn();

    const mockFormRef = {
      current: {
        setTouched: jest.fn(),
        validateForm: jest.fn(() => Promise.resolve(true)),
        errors: [1],
      },
    };

    const { getByTestId } = render(
      <FormNavigation
        formRef={mockFormRef}
        activeGroup={2}
        setActiveGroup={() => jest.fn()}
        totalGroup={3}
      />,
    );

    const submitButton = getByTestId('form-btn-submit');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockFormRef.current.setTouched).toHaveBeenCalledTimes(1);
      expect(mockFormRef.current.validateForm).toHaveBeenCalledTimes(1);
      expect(ToastAndroid.show).toHaveBeenCalledTimes(1);
    });
  });

  it('should not show Toast notification if no validation error when press Submit button', async () => {
    Platform.OS = 'android';
    ToastAndroid.show = jest.fn();

    const mockFormRef = {
      current: {
        setTouched: jest.fn(),
        validateForm: jest.fn(() => Promise.resolve(true)),
        errors: [],
      },
    };

    const { getByTestId } = render(
      <FormNavigation
        formRef={mockFormRef}
        activeGroup={2}
        setActiveGroup={() => jest.fn()}
        totalGroup={3}
      />,
    );

    const submitButton = getByTestId('form-btn-submit');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockFormRef.current.setTouched).toHaveBeenCalledTimes(1);
      expect(mockFormRef.current.validateForm).toHaveBeenCalledTimes(1);
      expect(ToastAndroid.show).toHaveBeenCalledTimes(0);
    });
  });
});
