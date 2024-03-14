import React, { useState } from 'react';
import { render, renderHook, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useNavigation, triggerBeforeRemoveEvent } from '@react-navigation/native';

import { FormState, UIState } from '../../../store';
import FormDataDetails from '../FormDataDetails';
import { washInSchool, washInSchoolForm } from '../dummy-for-test-purpose';
import { cascades } from '../../../lib';

jest.mock('@react-navigation/native');

jest.mock('expo-sqlite');
jest.mock('../../../lib', () => ({
  cascades: {
    loadDataSource: jest.fn(async (source, id) => id
        ? { rows: { length: 1, _array: [{ id: 65, name: 'Administration 65', parent: 0 }] } }
        : {
            rows: {
              length: 2,
              _array: [
                { id: 65, name: 'Administration 65', parent: 0 },
                { id: 66, name: 'Administration 66', parent: 0 },
              ],
            },
          }),
  },
  i18n: {
    text: jest.fn(() => ({
      latitude: 'Latitude',
      longitude: 'Longitude',
    })),
  },
}));

describe('FormDataDetails', () => {
  beforeAll(() => {
    const { json: valuesJSON } = washInSchool;
    act(() => {
      UIState.update((s) => {
        s.lang = 'en';
      });
      FormState.update((s) => {
        s.form = {
          json: JSON.stringify(washInSchoolForm).replace(/'/g, "''"),
        };
        s.currentValues = JSON.parse(JSON.parse(valuesJSON));
      });
    });
  });

  it('should render correctly', async () => {
    const mockNavigation = useNavigation();
    const { result: resultState } = renderHook(() => useState(0));
    const { result: resultForm } = renderHook(() => FormState.useState((s) => s.form));
    const { result: resultValues } = renderHook(() => FormState.useState((s) => s.currentValues));
    const [currentPage, setCurrentPage] = resultState.current;
    const { json: formJSON } = resultForm.current;
    const values = resultValues.current;

    const { getByTestId } = render(
      <FormDataDetails
        navigation={mockNavigation}
        formJSON={formJSON}
        values={values}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />,
    );

    const { result: resultCascade } = renderHook(() => useState(null));
    const [cascadeValue, setCascadeValue] = resultCascade.current;

    act(() => {
      setCascadeValue({ id: 65, name: 'Administration 65', parent: 0 });
    });

    // Wait for the fetchCascade to complete its asynchronous behavior
    await waitFor(() => expect(cascades.loadDataSource).toHaveBeenCalledTimes(1));

    await waitFor(() => {
      expect(cascadeValue).toEqual({ id: 65, name: 'Administration 65', parent: 0 });
      const questionText = getByTestId('text-question-0');
      expect(questionText).toBeDefined();
      const answerText = getByTestId('text-answer-0');
      expect(answerText).toBeDefined();
    });
  });

  it('should match with snapshot', async () => {
    const mockNavigation = useNavigation();
    const mockRoute = {
      params: {
        name: 'Datapoint name',
      },
    };

    const tree = render(<FormDataDetails navigation={mockNavigation} route={mockRoute} />);
    await waitFor(() => expect(tree.toJSON()).toMatchSnapshot());
  });

  it('should list changed when navigation clicked', async () => {
    const mockNavigation = useNavigation();
    const { result: resultState } = renderHook(() => useState(0));
    const { result: resultForm } = renderHook(() => FormState.useState((s) => s.form));
    const { result: resultValues } = renderHook(() => FormState.useState((s) => s.currentValues));
    const [currentPage, setCurrentPage] = resultState.current;
    const { json: formJSON } = resultForm.current;
    const values = resultValues.current;

    const { getByTestId } = render(
      <FormDataDetails
        navigation={mockNavigation}
        formJSON={formJSON}
        values={values}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />,
    );

    const buttonNext = getByTestId('button-next');
    expect(buttonNext).toBeDefined();
    fireEvent.press(buttonNext);

    act(() => {
      setCurrentPage(1);
    });

    await waitFor(() => {
      const questionText = getByTestId('text-question-0');
      expect(questionText).toBeDefined();
      const answerText = getByTestId('text-answer-0');
      expect(answerText).toBeDefined();
      const paginationText = getByTestId('text-pagination');
      expect(paginationText).toBeDefined();
      expect(paginationText.props.children).toEqual([2, '/', 2]);
    });
  });

  it('should clear currentValues when back button clicked', async () => {
    const mockNavigation = useNavigation();
    const { result: resultState } = renderHook(() => useState(0));
    const { result: resultForm } = renderHook(() => FormState.useState((s) => s.form));
    const { result: resultValues } = renderHook(() => FormState.useState((s) => s.currentValues));
    const [currentPage, setCurrentPage] = resultState.current;
    const { json: formJSON } = resultForm.current;
    const values = resultValues.current;

    render(
      <FormDataDetails
        navigation={mockNavigation}
        formJSON={formJSON}
        values={values}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />,
    );

    act(() => {
      triggerBeforeRemoveEvent({ data: { action: { type: 'FormData' } } });
      FormState.update((s) => {
        s.currentValues = {};
      });
    });

    await waitFor(() => {
      expect(resultValues.current).toEqual({});
    });
  });
});
