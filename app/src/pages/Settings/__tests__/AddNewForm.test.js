/* eslint-disable prefer-promise-reject-errors */
import React from 'react';
import renderer from 'react-test-renderer';
import { render, renderHook, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import api from '../../../lib/api';
import cascades from '../../../lib/cascades';

import AddNewForm from '../AddNewForm';
import { UIState } from '../../../store';

jest.mock('../../../lib/api');
jest.mock('../../../lib/cascades');
jest.mock('../../../database/crud');

describe('AddNewForm Page', () => {
  test('renders correctly', () => {
    const tree = renderer.create(<AddNewForm />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should show input form id and download button', () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;

    const wrapper = render(<AddNewForm navigation={navigation} />);

    const fidInput = wrapper.getByTestId('input-form-id');
    expect(fidInput).toBeDefined();
    const downloadButton = wrapper.getByTestId('button-download-form');
    expect(downloadButton).toBeDefined();
  });

  it('should not fetch form if network not available', async () => {
    Platform.OS = 'android';
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    api.post.mockImplementation(() => Promise.resolve({ data: { formsUrl: [] } }));

    const wrapper = render(<AddNewForm navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = false;
      });
    });

    const fidInput = wrapper.getByTestId('input-form-id');
    const downloadButton = wrapper.getByTestId('button-download-form');

    fireEvent.changeText(fidInput, '1');
    fireEvent.press(downloadButton);

    await waitFor(() => {
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  it('should fetch form if network available', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    api.get.mockImplementation(() => Promise.resolve({ data: { formsUrl: [] } }));

    const wrapper = render(<AddNewForm navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const fidInput = wrapper.getByTestId('input-form-id');
    const downloadButton = wrapper.getByTestId('button-download-form');

    fireEvent.changeText(fidInput, '1');
    fireEvent.press(downloadButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/forms/1');
    });
  });

  it('it should navigate to home page after form downloaded', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    // url: /forms/1
    const FormId1 = {
      id: 1,
      name: 'Household',
      version: '1.0.0',
      cascades: ['/cascades/1.sqlite'],
      question_group: [],
    };
    // url: /sqlite/file.sqlite
    const mockFile = 'file.sqlite';

    api.getConfig.mockImplementation(() => ({ baseURL: 'http://example.com' }));
    api.get.mockImplementation((url) => {
      if (url === '/forms/1') {
        Promise.resolve({ data: FormId1 });
      }
      if (url === '/cascades/1.sqlite') {
        Promise.resolve({ data: mockFile });
      }
    });

    const wrapper = render(<AddNewForm navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const fidInput = wrapper.getByTestId('input-form-id');
    const downloadButton = wrapper.getByTestId('button-download-form');

    fireEvent.changeText(fidInput, '1');
    fireEvent.press(downloadButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/forms/1');
      expect(cascades.download).toHaveBeenCalledWith(
        'http://example.com/cascades/1.sqlite',
        '/cascades/1.sqlite',
      );
    });
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('Home'));
  });

  it('should show error text if fetch form error', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    const mockErrorData = { message: 'Failed' };
    api.get.mockImplementation(() =>
      Promise.reject({ response: { ...mockErrorData, status: 400 } }),
    );

    const wrapper = render(<AddNewForm navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const fidInput = wrapper.getByTestId('input-form-id');
    const downloadButton = wrapper.getByTestId('button-download-form');

    fireEvent.changeText(fidInput, '1');
    fireEvent.press(downloadButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/forms/1');
      const errorText = wrapper.getByTestId('fetch-error-text');
      expect(errorText).toBeTruthy();
    });
  });

  it('should be error 500', async () => {
    const { result: navigationRef } = renderHook(() => useNavigation());
    const navigation = navigationRef.current;
    api.get.mockImplementation(() =>
      Promise.reject({ response: { message: 'Failed', status: 500 } }),
    );

    const wrapper = render(<AddNewForm navigation={navigation} />);

    act(() => {
      UIState.update((s) => {
        s.online = true;
      });
    });

    const fidInput = wrapper.getByTestId('input-form-id');
    const downloadButton = wrapper.getByTestId('button-download-form');

    fireEvent.changeText(fidInput, '1');
    fireEvent.press(downloadButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/forms/1');
    });
  });
});
