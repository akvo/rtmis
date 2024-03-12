import { renderHook, act } from '@testing-library/react-native';
import AuthState from '../auth';

describe('AuthState', () => {
  it('should initialize with the correct default state', () => {
    const { result } = renderHook(() => AuthState.useState());
    const { useAuthenticationCode, authenticationCode, username, password } = result.current;

    expect(useAuthenticationCode).toBe(false);
    expect(authenticationCode).toBe('');

    expect(username).toBe('');
    expect(password).toBe('');
  });

  it('should updating the state correctly', () => {
    const { result } = renderHook(() => AuthState.useState());
    act(() => {
      AuthState.update((s) => {
        s.useAuthenticationCode = true;
        s.authenticationCode = 'testing123';
        s.username = 'jhondoe';
        s.password = 'secret';
      });
    });
    const { useAuthenticationCode, authenticationCode, username, password } = result.current;
    expect(useAuthenticationCode).toBe(true);
    expect(authenticationCode).toBe('testing123');
    expect(username).toBe('jhondoe');
    expect(password).toBe('secret');
  });
});
