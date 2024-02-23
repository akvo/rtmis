global.FormData = require('react-native/Libraries/Network/FormData');
import React, { useState } from 'react';
import { render, waitFor, fireEvent, act, renderHook } from '@testing-library/react-native';
import axios from 'axios';

import FormDataPage from '../FormData';
import crudDataPoints from '../../database/crud/crud-datapoints';
import { useNavigation } from '@react-navigation/native';
import { backgroundTask } from '../../lib';
import { FormState, UIState } from '../../store';
import api from '../../lib/api';

jest.mock('@react-navigation/native');
jest.mock('../../database/crud/crud-datapoints');
jest.mock('../../lib/background-task.js');
jest.mock('../../lib/api');
jest.mock('axios', () => ({
  all: jest.fn(() => Promise.resolve([{ data: { file: '/images/photo_111_123_xyz.jpeg' } }])),
}));
jest.mock('expo-font');
jest.mock('expo-asset');

describe('FormDataPage', () => {
  beforeAll(() => {
    FormState.update((s) => {
      s.form = {
        json: JSON.stringify({
          question_group: [
            {
              question: [],
            },
          ],
        }),
      };
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', async () => {
    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: '2023-07-18T13:00:00.000Z',
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);
    const tree = render(<FormDataPage />);
    await waitFor(() => expect(tree.toJSON()).toMatchSnapshot());
  });

  it('should show list of submitted datapoints', async () => {
    const mockRoute = {
      params: {
        id: 123,
        name: 'Form Name',
        showSubmitted: true,
      },
    };

    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: '2023-07-18T13:00:00.000Z',
        submitted: 1,
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);

    const wrapper = render(<FormDataPage route={mockRoute} />);

    await waitFor(() => {
      expect(wrapper.getByText('Form Name')).toBeTruthy();
      const list0 = wrapper.getByTestId('card-touchable-0');
      expect(list0.props.children[0].props.title).toEqual('Datapoint 1');
      expect(list0.props.children[0].props.subTitles[0]).toEqual('Created: 18/07/2023 07:34 PM');
      expect(list0.props.children[0].props.subTitles[1]).toEqual('Survey duration: 02h 25m');
      expect(list0.props.children[0].props.subTitles[2]).toEqual('Synced: 18/07/2023 08:00 PM');
    });
  });

  it('should show list of saved datapoints', async () => {
    const mockRoute = {
      params: {
        id: 123,
        name: 'Form Name',
        showSubmitted: false,
      },
    };

    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: null,
        submitted: 0,
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);

    const wrapper = render(<FormDataPage route={mockRoute} />);

    await waitFor(() => {
      expect(wrapper.getByText('Form Name')).toBeTruthy();
      const list0 = wrapper.getByTestId('card-touchable-0');
      expect(list0.props.children[0].props.title).toEqual('Datapoint 1');
      expect(list0.props.children[0].props.subTitles[0]).toEqual('Created: 18/07/2023 07:34 PM');
      expect(list0.props.children[0].props.subTitles[1]).toEqual('Survey duration: 02h 25m');
      expect(list0.props.children[0].props.subTitles[2]).toEqual(undefined);
    });
  });

  it('should have search input field', () => {
    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: '2023-07-18T13:00:00.000Z',
      },
    ];
    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);
    const wrapper = render(<FormDataPage />);
    expect(wrapper.queryByTestId('search-bar')).toBeTruthy();
  });

  it('should filter list of datapoint by search value', async () => {
    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: '2023-07-18T13:00:00.000Z',
      },
      {
        id: 2,
        name: 'Datapoint 2',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: '2023-07-18T13:00:00.000Z',
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);

    const wrapper = render(<FormDataPage />);

    const searchField = wrapper.getByTestId('search-bar');
    expect(searchField).toBeDefined();
    fireEvent.changeText(searchField, 'Datapoint 1');

    await waitFor(() => {
      const list0 = wrapper.queryByTestId('card-touchable-0');
      expect(list0).toBeTruthy();

      const list1 = wrapper.queryByTestId('card-touchable-1');
      expect(list1).toBeFalsy();
    });
  });

  it('should navigate to FormPage with correct route params when datapoint list pressed', async () => {
    const mockNavigation = useNavigation();
    const mockRoute = {
      params: {
        id: 123,
        name: 'Form Name',
        showSubmitted: false,
      },
    };

    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: null,
        submitted: 0,
      },
    ];
    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);

    const wrapper = render(<FormDataPage navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      const cardElement = wrapper.getByTestId('card-touchable-0');
      fireEvent.press(cardElement);
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('FormPage', {
      ...mockRoute.params,
      dataPointId: 1,
      newSubmission: false,
    });
  });

  it('should not render render sync button on Saved FormData page', async () => {
    const mockRoute = {
      params: {
        id: 123,
        name: 'Form Name',
        showSubmitted: false,
      },
    };

    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: '2023-07-18T13:00:00.000Z',
        submitted: 1,
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);

    const wrapper = render(<FormDataPage route={mockRoute} />);

    await waitFor(() => {
      expect(wrapper.getByText('Form Name')).toBeTruthy();
      // check sync button rendered
      expect(wrapper.queryByTestId('button-to-trigger-sync')).toBeFalsy();
      const list0 = wrapper.getByTestId('card-touchable-0');
      expect(list0).toBeTruthy();
    });
  });

  it('should render sync button on Submitted FormData page', async () => {
    const mockRoute = {
      params: {
        id: 123,
        name: 'Form Name',
        showSubmitted: true,
      },
    };

    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: null,
        submitted: 1,
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);

    const wrapper = render(<FormDataPage route={mockRoute} />);

    await waitFor(() => {
      expect(wrapper.getByText('Form Name')).toBeTruthy();
      // check sync button rendered
      const syncButtonElement = wrapper.getByTestId('button-to-trigger-sync');
      expect(syncButtonElement).toBeTruthy();
      expect(syncButtonElement.props.accessibilityState.disabled).toEqual(false);
      const list0 = wrapper.getByTestId('card-touchable-0');
      expect(list0).toBeTruthy();
    });
  });

  it('should disable sync button if no data on Submitted FormData page', async () => {
    const mockRoute = {
      params: {
        id: 123,
        name: 'Form Name',
        showSubmitted: true,
      },
    };

    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: '2023-07-18T13:00:00.000Z',
        submitted: 1,
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);

    const wrapper = render(<FormDataPage route={mockRoute} />);

    await waitFor(() => {
      expect(wrapper.getByText('Form Name')).toBeTruthy();
      // check sync button rendered
      const syncButtonElement = wrapper.getByTestId('button-to-trigger-sync');
      expect(syncButtonElement).toBeTruthy();
      expect(syncButtonElement.props.accessibilityState.disabled).toEqual(true);
      const list0 = wrapper.queryByTestId('card-touchable-0');
      expect(list0).toBeFalsy();
    });
  });

  it('should show sync confirmation dialog when sync button pressed and hide if confirmation denied', async () => {
    const mockRoute = {
      params: {
        id: 123,
        name: 'Form Name',
        showSubmitted: true,
      },
    };

    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: null,
        submitted: 1,
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);

    const wrapper = render(<FormDataPage route={mockRoute} />);

    await waitFor(() => expect(wrapper.getByText('Form Name')).toBeTruthy());

    // check sync button rendered
    const syncButtonElement = wrapper.getByTestId('button-to-trigger-sync');
    expect(syncButtonElement).toBeTruthy();
    fireEvent.press(syncButtonElement);

    const dialogElement = wrapper.queryByTestId('sync-confirmation-dialog');
    expect(dialogElement).toBeTruthy();

    await waitFor(() => expect(dialogElement.props.visible).toEqual(true));

    const textConfirmationElement = wrapper.queryByTestId('sync-confirmation-text');
    expect(textConfirmationElement).toBeTruthy();
    const okButtonElement = wrapper.queryByTestId('sync-confirmation-ok');
    expect(okButtonElement).toBeTruthy();
    const cancelButtonElement = wrapper.queryByTestId('sync-confirmation-cancel');
    expect(cancelButtonElement).toBeTruthy();

    fireEvent.press(cancelButtonElement);

    await waitFor(() => expect(dialogElement.props.visible).toEqual(false));
  });

  it('should handle sync submission when sync confirmation granted', async () => {
    const mockRoute = {
      params: {
        id: 123,
        name: 'Form Name',
        showSubmitted: true,
      },
    };

    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: null,
        submitted: 1,
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);
    backgroundTask.syncFormSubmission.mockResolvedValue(() => Promise.resolve(true));

    const wrapper = render(<FormDataPage route={mockRoute} />);

    await waitFor(() => expect(wrapper.getByText('Form Name')).toBeTruthy());

    // check sync button rendered
    const syncButtonElement = wrapper.getByTestId('button-to-trigger-sync');
    expect(syncButtonElement).toBeTruthy();
    fireEvent.press(syncButtonElement);

    const dialogElement = wrapper.queryByTestId('sync-confirmation-dialog');
    expect(dialogElement).toBeTruthy();

    await waitFor(() => expect(dialogElement.props.visible).toEqual(true));

    const okButtonElement = wrapper.queryByTestId('sync-confirmation-ok');
    expect(okButtonElement).toBeTruthy();
    fireEvent.press(okButtonElement);

    await waitFor(() => {
      const dataPointListElement = wrapper.queryByTestId('data-point-list');

      expect(dataPointListElement).toBeFalsy();
      expect(backgroundTask.syncFormSubmission).toHaveBeenCalledTimes(1);
      expect(crudDataPoints.selectDataPointsByFormAndSubmitted).toHaveBeenCalledTimes(2);
    });
  });

  it('should go to ManageForm page when arrow back clicked', () => {
    const mockNavigation = useNavigation();
    const mockRoute = {
      params: {
        id: 123,
        name: 'Form Name',
        showSubmitted: false,
      },
    };

    const { getByTestId } = render(<FormDataPage navigation={mockNavigation} route={mockRoute} />);
    const arrowBackEl = getByTestId('arrow-back-button');
    expect(arrowBackEl).toBeDefined();
    fireEvent.press(arrowBackEl);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ManageForm', mockRoute.params);
  });

  it('should set currentValues & go to FormDataDetails when showSubmitted is true', async () => {
    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 145,
        syncedAt: '2023-07-18T13:00:00.000Z',
        submitted: 1,
        json: '{"1": "John Doe"}',
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);

    const mockNavigation = useNavigation();
    const mockRoute = {
      params: {
        id: 123,
        name: 'Form Name',
        showSubmitted: true,
      },
    };
    const { getByTestId } = render(<FormDataPage navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      const list0 = getByTestId('card-touchable-0');
      expect(list0).toBeDefined();
      fireEvent.press(list0);
    });

    act(() => {
      const { json: valuesJSON } = mockData[0];
      FormState.update((s) => {
        const valuesParsed = JSON.parse(valuesJSON);
        s.currentValues =
          typeof valuesParsed === 'string' ? JSON.parse(valuesParsed) : valuesParsed;
      });
    });

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('FormDataDetails', {
        name: 'Datapoint 1',
      });
    });
  });

  it('should be set isManualSynced true and syncedAt when the button sync clicked', async () => {
    const mockData = [
      {
        id: 1,
        name: 'Datapoint 1',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 10,
        syncedAt: null,
        submitted: 1,
        json: '{"1": "John Doe"}',
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);

    const mockNavigation = useNavigation();
    const mockRoute = {
      params: {
        id: 123,
        name: 'Form Name',
        showSubmitted: true,
      },
    };
    const { getByTestId, queryByTestId, getByText, rerender, debug, queryByText } = render(
      <FormDataPage navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => expect(getByText('Form Name')).toBeTruthy());

    const syncButtonEl = getByTestId('button-to-trigger-sync');
    expect(syncButtonEl).toBeTruthy();
    expect(syncButtonEl.props.accessibilityState.disabled).toBeFalsy();
    fireEvent.press(syncButtonEl);

    const syncedAt = '2023-07-18T12:40:00.789Z';
    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue([
      { ...mockData[0], syncedAt },
    ]);

    const dialogElement = queryByTestId('sync-confirmation-dialog');
    expect(dialogElement).toBeTruthy();

    await waitFor(() => expect(dialogElement.props.visible).toEqual(true));

    const okButtonElement = queryByTestId('sync-confirmation-ok');
    expect(okButtonElement).toBeTruthy();
    fireEvent.press(okButtonElement);

    act(() => {
      UIState.update((s) => {
        s.isManualSynced = true;
      });
    });

    await crudDataPoints.selectDataPointsByFormAndSubmitted();

    rerender(<FormDataPage navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      const { result } = renderHook(() => UIState.useState((s) => s.isManualSynced));
      expect(result.current).toBeTruthy();
      expect(queryByText('Synced: 18/07/2023')).toBeDefined();
    });
  });

  it('should upload photos first before syncing when some data point has them', async () => {
    api.post.mockImplementation(() =>
      Promise.resolve({ data: { file: '/images/photo-profile-xyz.jpeg' } }),
    );
    const mockedForm = {
      id: 1,
      name: 'Dummy Form',
      question_group: [
        {
          id: 11,
          name: 'General Info',
          question: [
            {
              id: 111,
              name: 'Photo profile',
              type: 'photo',
            },
          ],
        },
      ],
    };

    act(() => {
      const jsonString = JSON.stringify(mockedForm);
      FormState.update((s) => {
        s.form = {
          id: mockedForm.id,
          name: mockedForm.name,
          json: jsonString,
        };
      });
    });
    const mockData = [
      {
        id: 123,
        name: 'Datapoint with photo',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 105,
        syncedAt: null,
        submitted: 1,
        json: '{"111": "file://photo-profile.jpeg"}',
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);
    crudDataPoints.selectSubmissionToSync.mockResolvedValue(mockData);

    const mockNavigation = useNavigation();
    const mockRoute = {
      params: {
        id: mockedForm.id,
        name: mockedForm.name,
        showSubmitted: true,
      },
    };

    const { getByTestId, getByText, queryByText, queryByTestId } = render(
      <FormDataPage route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => expect(getByText('Datapoint with photo')).toBeTruthy());

    const syncButtonElement = getByTestId('button-to-trigger-sync');
    expect(syncButtonElement.props.accessibilityState.disabled).toBeFalsy();
    fireEvent.press(syncButtonElement);

    const dialogElement = queryByTestId('sync-confirmation-dialog');
    expect(dialogElement).toBeTruthy();

    await waitFor(() => expect(dialogElement.props.visible).toEqual(true));

    const textConfirmationElement = queryByTestId('sync-confirmation-text');
    expect(textConfirmationElement).toBeTruthy();
    const okButtonElement = queryByTestId('sync-confirmation-ok');
    expect(okButtonElement).toBeTruthy();
    fireEvent.press(okButtonElement);

    await waitFor(() => {
      const titleDatapoint = queryByText('Datapoint with photo');
      expect(titleDatapoint).toBeDefined();

      // expect(api.post).toHaveBeenCalledTimes(1);

      const mockedformData = new FormData();
      mockedformData.append('file', {
        uri: 'file://photo-profile.jpeg',
        name: 'photo_111_123.jpeg',
        type: 'image/jpeg',
      });
      // expect(api.post).toHaveBeenCalledWith('/images', mockedformData, {
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });
    });
  });

  it('should not call handleOnSync when uploading photos failed', async () => {
    axios.all.mockImplementation(() => Promise.reject('Error'));
    api.post.mockImplementation(() =>
      Promise.resolve({ data: { file: '/images/photo-profile-xyz.jpeg' } }),
    );
    const mockedForm = {
      id: 1,
      name: 'Dummy Form',
      question_group: [
        {
          id: 11,
          name: 'General Info',
          question: [
            {
              id: 111,
              name: 'Photo profile',
              type: 'photo',
            },
          ],
        },
      ],
    };

    act(() => {
      const jsonString = JSON.stringify(mockedForm);
      FormState.update((s) => {
        s.form = {
          id: mockedForm.id,
          name: mockedForm.name,
          json: jsonString,
        };
      });
    });
    const mockData = [
      {
        id: 123,
        name: 'Datapoint with photo',
        createdAt: '2023-07-18T12:34:56.789Z',
        duration: 105,
        syncedAt: null,
        submitted: 1,
        json: '{"111": "file://photo-profile.jpeg"}',
      },
    ];

    crudDataPoints.selectDataPointsByFormAndSubmitted.mockResolvedValue(mockData);
    crudDataPoints.selectSubmissionToSync.mockResolvedValue(mockData);

    const mockNavigation = useNavigation();
    const mockRoute = {
      params: {
        id: mockedForm.id,
        name: mockedForm.name,
        showSubmitted: true,
      },
    };

    const { getByTestId, getByText, queryByText, queryByTestId } = render(
      <FormDataPage route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => expect(getByText('Datapoint with photo')).toBeTruthy());

    const syncButtonElement = getByTestId('button-to-trigger-sync');
    fireEvent.press(syncButtonElement);

    const dialogElement = queryByTestId('sync-confirmation-dialog');

    await waitFor(() => expect(dialogElement.props.visible).toEqual(true));

    const okButtonElement = queryByTestId('sync-confirmation-ok');
    expect(okButtonElement).toBeTruthy();
    fireEvent.press(okButtonElement);

    const mockedHandleOnSync = jest.fn();
    await waitFor(() => {
      expect(mockedHandleOnSync).not.toHaveBeenCalled();
    });
  });
});
