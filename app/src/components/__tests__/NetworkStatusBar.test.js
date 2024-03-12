import React from 'react';
import { render, renderHook, fireEvent, act, waitFor } from '@testing-library/react-native';
import { UIState } from '../../store';
import NetworkStatusBar from '../NetworkStatusBar';

describe('NetworkStatusBar', () => {
  it('should render correctly when offline', () => {
    const { getByTestId } = render(<NetworkStatusBar />);
    const textEl = getByTestId('offline-text');
    expect(textEl).toBeDefined();
    expect(textEl.props.children).toBe("You're offline...");
  });

  it('should render null when online', () => {
    const { queryByTestId } = render(<NetworkStatusBar />);
    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });
    const textEl = queryByTestId('offline-text');
    expect(textEl).toBeNull();
  });
});
