import { renderHook, act } from '@testing-library/react-native';
import UserState from '../users';

describe('UserState', () => {
  it('should initialize with the correct default state', () => {
    const { result } = renderHook(() => UserState.useState());
    const { id, name, token, syncWifiOnly, forms, certifications } = result.current;
    expect(id).toBe(null);
    expect(name).toBe('');
    expect(token).toBe(null);
    expect(syncWifiOnly).toBe(0);
    expect(forms).toEqual([]);
    expect(certifications).toEqual([]);
  });

  it('should updating the state correctly', () => {
    const { result } = renderHook(() => UserState.useState());
    const userData = {
      id: 1,
      name: 'Jhon doe',
      token: 'Bearer eyjtoken',
      forms: [
        {
          id: 123,
          url: '/forms/123',
          version: '1.2.0',
        },
      ],
      certifications: [12345],
    };
    const userPreferences = {
      syncWifiOnly: true,
      syncInterval: 500,
      lang: 'fr',
    };
    act(() => {
      UserState.update((s) => {
        s.id = userData.id;
        s.name = userData.name;
        s.token = userData.token;
        s.syncInterval = userPreferences.syncInterval;
        s.syncWifiOnly = userPreferences.syncWifiOnly;
        s.forms = userData.forms;
        s.certifications = userData.certifications;
      });
    });
    const { id, name, token, syncInterval, syncWifiOnly, forms, certifications } = result.current;
    expect(id).toBe(userData.id);
    expect(name).toBe(userData.name);
    expect(token).toBe(userData.token);
    expect(forms).toBe(userData.forms);
    expect(syncInterval).toBe(userPreferences.syncInterval);
    expect(syncWifiOnly).toBe(userPreferences.syncWifiOnly);
    expect(certifications).toBe(userData.certifications);
  });
});
