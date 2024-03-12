import { renderHook, act } from '@testing-library/react-native';
import UIState from '../ui';

describe('UIState', () => {
  it('should initialize with the correct default state', () => {
    const { result } = renderHook(() => UIState.useState());
    const { fontSize, lang, isDarkMode, currentPage, online } = result.current;
    expect(fontSize).toBe(16);
    expect(lang).toBe('en');
    expect(isDarkMode).toBe(false);
    expect(currentPage).toBe('GetStarted');
    expect(online).toBe(false);
  });

  it('should updating the state correctly', () => {
    const { result } = renderHook(() => UIState.useState());
    act(() => {
      UIState.update((s) => {
        s.isDarkMode = true;
        s.lang = 'fr';
        s.fontSize = 'large';
        s.online = true;
        s.currentPage = 'Home';
      });
    });
    const { isDarkMode, lang, fontSize, online, currentPage } = result.current;
    expect(isDarkMode).toBe(true);
    expect(lang).toBe('fr');
    expect(fontSize).toBe('large');
    expect(online).toBe(true);
    expect(currentPage).toBe('Home');
  });
});
