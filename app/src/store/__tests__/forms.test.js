import { renderHook, act } from '@testing-library/react-native';
import FormState from '../forms';

describe('FormState', () => {
  it('should initialize with the correct default state', () => {
    const { result } = renderHook(() => FormState.useState());
    const { form, currentValues } = result.current;
    expect(form).toEqual({});
    expect(currentValues).toEqual({});
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
    act(() => {
      FormState.update((s) => {
        s.form = selectedForm;
        s.currentValues = { 1: 'John Doe', 2: 12 };
      });
    });
    const { form, currentValues } = result.current;
    expect(form).toBe(selectedForm);
    expect(currentValues).toEqual({ 1: 'John Doe', 2: 12 });
  });
});
