import React from 'react';
import { render, fireEvent, waitFor } from 'react-native-testing-library';
import { act } from '@testing-library/react-native';
import FormNavigation from '../FormNavigation';
import { FormState } from '../../../store';

jest
  .useFakeTimers({
    doNotFake: [
      'nextTick',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  })
  .setSystemTime(new Date('2024-03-15'));
jest.mock('expo-font');
jest.mock('expo-asset');

const firstGroup = {
  name: 'registration',
  label: 'Registration',
  order: 1,
  question: [
    {
      id: 11,
      name: 'your_name',
      label: 'Your Name',
      order: 1,
      type: 'input',
      required: true,
      meta: true,
    },
  ],
};

const lastGroup = {
  name: 'hygiene',
  label: 'Hygiene',
  order: 2,
  question: [
    {
      id: 21,
      name: 'water_available',
      label: 'Water available?',
      order: 1,
      type: 'option',
      required: true,
      meta: true,
      option: [
        {
          id: 211,
          label: 'Yes',
          value: 'yes',
          order: 1,
        },
        {
          id: 212,
          label: 'No',
          value: 'no',
          order: 2,
        },
      ],
    },
  ],
};

describe('FormNavigation component', () => {
  it('renders form navigation correctly', () => {
    const setActiveGroup = jest.fn();
    const onSubmit = jest.fn();
    const mockSetShowQuestionGroupList = jest.fn();
    const mockShowDialog = jest.fn();

    const { getByTestId, getByText, queryByTestId } = render(
      <FormNavigation
        currentGroup={firstGroup}
        activeGroup={0}
        setActiveGroup={setActiveGroup}
        onSubmit={onSubmit}
        totalGroup={2}
        showQuestionGroupList={false}
        setShowQuestionGroupList={mockSetShowQuestionGroupList}
        setShowDialogMenu={mockShowDialog}
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

  it('should move to the next page', async () => {
    const setActiveGroup = jest.fn();
    const onSubmit = jest.fn();
    const mockSetShowQuestionGroupList = jest.fn();
    const mockShowDialog = jest.fn();

    const { getByTestId, queryByTestId, rerender } = render(
      <FormNavigation
        currentGroup={firstGroup}
        activeGroup={0}
        setActiveGroup={setActiveGroup}
        onSubmit={onSubmit}
        totalGroup={2}
        showQuestionGroupList={false}
        setShowQuestionGroupList={mockSetShowQuestionGroupList}
        setShowDialogMenu={mockShowDialog}
      />,
    );

    act(() => {
      FormState.update((s) => {
        s.currentValues = {
          ...s.currentValues,
          11: 'John Doe',
        };
      });
    });

    const btnNext = getByTestId('form-nav-btn-next');
    expect(btnNext).toBeDefined();

    fireEvent.press(btnNext);

    rerender(
      <FormNavigation
        currentGroup={lastGroup}
        activeGroup={1}
        setActiveGroup={setActiveGroup}
        onSubmit={onSubmit}
        totalGroup={2}
        showQuestionGroupList={false}
        setShowQuestionGroupList={mockSetShowQuestionGroupList}
        setShowDialogMenu={mockShowDialog}
      />,
    );

    await waitFor(() => {
      expect(setActiveGroup).toHaveBeenCalledTimes(1);
      expect(setActiveGroup).toHaveBeenCalledWith(1);
      const btnSubmit = queryByTestId('form-btn-submit');
      expect(btnSubmit).toBeDefined();
    });
  });

  it('should disable navigation button when group list show', async () => {
    const setActiveGroup = jest.fn();
    const onSubmit = jest.fn();
    const mockSetShowQuestionGroupList = jest.fn();
    const mockShowDialog = jest.fn();

    const { getByTestId } = render(
      <FormNavigation
        currentGroup={firstGroup}
        activeGroup={0}
        setActiveGroup={setActiveGroup}
        onSubmit={onSubmit}
        totalGroup={2}
        showQuestionGroupList
        setShowQuestionGroupList={mockSetShowQuestionGroupList}
        setShowDialogMenu={mockShowDialog}
      />,
    );

    const btnBack = getByTestId('form-nav-btn-back');
    expect(btnBack).toBeDefined();
    expect(btnBack.props.accessibilityState.disabled).toBeTruthy();

    const btnNext = getByTestId('form-nav-btn-next');
    expect(btnNext).toBeDefined();
    expect(btnNext.props.accessibilityState.disabled).toBeTruthy();
  });
});
