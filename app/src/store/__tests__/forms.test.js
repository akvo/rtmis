import { renderHook, act } from '@testing-library/react-native';
import FormState from '../forms';

describe('FormState', () => {
  it('should initialize with the correct default state', () => {
    const { result } = renderHook(() => FormState.useState());
    const { form, currentValues, questionGroupListCurrentValues } = result.current;
    expect(form).toEqual({});
    expect(currentValues).toEqual({});
    expect(questionGroupListCurrentValues).toEqual({});
  });

  it('should updating the state correctly', () => {
    const { result } = renderHook(() => FormState.useState());
    const selectedForm = {
      id: 123,
      name: 'Complain form',
      url: '/forms/123',
      version: '1.2.0',
      totalGroup: 2,
    };
    const qg = [
      {
        id: 1,
        name: 'Profile',
      },
      {
        id: 2,
        name: 'Complain',
      },
    ];
    const qs = [
      {
        id: 3,
        text: 'Description',
      },
    ];
    act(() => {
      FormState.update((s) => {
        s.form = selectedForm;
        s.currentValues = { 1: 'John Doe', 2: 12 };
        s.questionGroupListCurrentValues = { 1: 'John Doe' };
      });
    });
    const { form, currentValues, questionGroupListCurrentValues } = result.current;
    expect(form).toBe(selectedForm);
    expect(currentValues).toEqual({ 1: 'John Doe', 2: 12 });
    expect(questionGroupListCurrentValues).toEqual({ 1: 'John Doe' });
  });
});
