import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import HomePage from '../Home';
import crudForms from '../../database/crud/crud-forms';
import FormState from '../../store/forms';
import { UserState, UIState } from '../../store';

const mockDateNow = new Date().toISOString();
const mockForms = [
  {
    id: 1,
    formId: 9001,
    version: '1.0.0',
    latest: 1,
    name: 'Form 1',
    json: JSON.stringify({ id: 9001, name: 'Form 1', question_group: [] }),
    createdAt: mockDateNow,
    submitted: 2,
    draft: 0,
    synced: 2,
    userId: 1,
  },
  {
    id: 2,
    formId: 9002,
    version: '1.0.1',
    latest: 1,
    name: 'Form 2',
    json: JSON.stringify({ id: 9002, name: 'Form 2', question_group: [] }),
    createdAt: mockDateNow,
    submitted: 1,
    draft: 3,
    synced: 0,
    userId: 1,
  },
  {
    id: 3,
    formId: 9002,
    version: '1.0.0',
    latest: 0,
    name: 'Form 2',
    json: JSON.stringify({ id: 9002, name: 'Form 2', question_group: [] }),
    createdAt: mockDateNow,
    submitted: 2,
    draft: 1,
    synced: 1,
    userId: 1,
  },
];

jest.mock('../../database/crud/crud-forms');
jest.mock('../../store/forms');
const mockNavigation = {
  navigate: jest.fn(),
};

describe('Homepage', () => {
  beforeAll(() => {
    UserState.update((s) => {
      s.id = 1;
      s.syncWifiOnly = 0;
    });
    UIState.update((s) => {
      s.online = true;
    });
    const mockLatestFormVersion = mockForms.filter((form) => form.latest);
    crudForms.selectLatestFormVersion.mockImplementation(() =>
      Promise.resolve(mockLatestFormVersion),
    );
  });

  test('renders correctly', async () => {
    const tree = render(<HomePage navigation={mockNavigation} />);

    await waitFor(() => expect(tree.toJSON()).toMatchSnapshot());
  });

  it('should render page title, search field and back button', async () => {
    const wrapper = render(<HomePage navigation={mockNavigation} />);

    await waitFor(() => {
      const titleElement = wrapper.getByText('Form Lists');
      expect(titleElement).toBeDefined();

      const searchField = wrapper.getByTestId('search-bar');
      expect(searchField).toBeDefined();

      const backButton = wrapper.getByTestId('button-users');
      expect(backButton).toBeDefined();
    });
  });

  it('should load last form version data from DB with form stats', async () => {
    const wrapper = render(<HomePage navigation={mockNavigation} />);

    await waitFor(() => {
      expect(crudForms.selectLatestFormVersion).toHaveBeenCalledTimes(1);
    });

    const listForm1 = wrapper.queryByTestId('card-touchable-1');
    expect(listForm1).toBeTruthy();
    expect(listForm1.props.children[0].props.title).toEqual('Form 1');
    expect(listForm1.props.children[0].props.subTitles).toEqual([
      'Version: 1.0.0',
      'Submitted: 2',
      'Saved: 0',
      'Synced: 2',
    ]);

    const listForm2 = wrapper.queryByTestId('card-touchable-2');
    expect(listForm2).toBeTruthy();
    expect(listForm2.props.children[0].props.title).toEqual('Form 2');
    expect(listForm2.props.children[0].props.subTitles).toEqual([
      'Version: 1.0.1',
      'Submitted: 1',
      'Saved: 3',
      'Synced: 0',
    ]);

    const listForm3 = wrapper.queryByTestId('card-touchable-3');
    expect(listForm3).toBeFalsy();
  });

  it('should filter forms by search value', async () => {
    const wrapper = render(<HomePage navigation={mockNavigation} />);

    await waitFor(() => {
      expect(crudForms.selectLatestFormVersion).toHaveBeenCalledTimes(1);
    });

    const searchField = wrapper.getByTestId('search-bar');
    expect(searchField).toBeDefined();
    fireEvent.changeText(searchField, 'Form 1');

    const listForm1 = wrapper.queryByTestId('card-touchable-1');
    expect(listForm1).toBeTruthy();

    const listForm2 = wrapper.queryByTestId('card-touchable-2');
    expect(listForm2).toBeFalsy();

    const listForm3 = wrapper.queryByTestId('card-touchable-3');
    expect(listForm3).toBeFalsy();
  });

  it('should navigate to ManageForm page when form list pressed', async () => {
    const mockFindData = mockForms.find((form) => form.id === 1);
    FormState.update.mockImplementation(() => mockFindData);

    const wrapper = render(<HomePage navigation={mockNavigation} />);

    await waitFor(() => {
      expect(crudForms.selectLatestFormVersion).toHaveBeenCalledTimes(1);
    });

    const listForm1 = wrapper.queryByTestId('card-touchable-1');
    expect(listForm1).toBeTruthy();
    fireEvent.press(listForm1);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ManageForm', {
        formId: 9001,
        id: 1,
        name: 'Form 1',
      });
    });
  });

  it('should navigate to Users page when back button clicked', async () => {
    const wrapper = render(<HomePage navigation={mockNavigation} />);

    await waitFor(() => {
      expect(crudForms.selectLatestFormVersion).toHaveBeenCalledTimes(1);
    });

    const backButton = wrapper.getByTestId('button-users');
    expect(backButton).toBeDefined();
    fireEvent.press(backButton);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Users');
    });
  });

  it('should reset form and data when app language changed', async () => {
    const { queryByTestId } = render(<HomePage navigation={mockNavigation} />);

    act(() => {
      UIState.update((s) => {
        s.lang = 'fr';
      });
      FormState.update((s) => {
        s.form = {};
      });
    });

    await waitFor(() => {
      const listForm1 = queryByTestId('card-touchable-1');
      expect(listForm1).toBeTruthy();

      expect(listForm1.props.children[0].props.subTitles).toEqual([
        'Version: 1.0.0',
        'Soumis: 2',
        'Brouillon: 0',
        'Synchronisé: 2',
      ]);
    });
  });

  it('should disable sync datapoint button when syncWifiOnly is true & network type cellular', async () => {
    act(() => {
      UserState.update((s) => {
        s.syncWifiOnly = 1;
      });
    });

    const { getByTestId } = render(<HomePage navigation={mockNavigation} />);

    act(() => {
      UIState.update((s) => {
        s.networkType = 'CELLULAR';
      });
    });

    await waitFor(() => {
      const syncButton = getByTestId('sync-datapoint-button');
      expect(syncButton.props.accessibilityState?.disabled).toBeTruthy();
    });
  });

  it('should enable sync datapoint button when syncWifiOnly is false & network type cellular', async () => {
    const { getByTestId } = render(<HomePage navigation={mockNavigation} />);

    act(() => {
      UserState.update((s) => {
        s.syncWifiOnly = 0;
      });

      UIState.update((s) => {
        s.networkType = 'CELLULAR';
      });
    });

    await waitFor(() => {
      const syncButton = getByTestId('sync-datapoint-button');
      expect(syncButton.props.accessibilityState?.disabled).toBeFalsy();
    });
  });
});
