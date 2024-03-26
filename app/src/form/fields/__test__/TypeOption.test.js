import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';
import TypeOption from '../TypeOption';

// According to the issue on @testing-library/react-native
jest.spyOn(View.prototype, 'measureInWindow').mockImplementation((cb) => {
  cb(18, 113, 357, 50);
});

describe('TypeOption component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders dropdown options correctly', async () => {
    const setFieldValueMock = jest.fn();
    const onChangeMock = jest.fn();
    const values = {};
    const option = [
      { name: 'option1', label: 'Option 1' },
      { name: 'option2', label: 'Option 2' },
      { name: 'option3', label: 'Option 3' },
      { name: 'option4', label: 'Option 4' },
    ];

    const { getByTestId } = render(
      <TypeOption
        onChange={onChangeMock}
        value={values}
        id="dropdown"
        label="Dropdown Field"
        option={option}
        setFieldValue={setFieldValueMock}
      />,
    );

    const dropdown = getByTestId('type-option-dropdown');
    expect(dropdown).toBeDefined();
  });

  it('should translate option dropdown text', async () => {
    const setFieldValueMock = jest.fn();
    const values = {};

    const onChangeMock = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });
    const option = [
      {
        id: 1681108456316,
        code: 'C21A',
        name: 'Pipeline connection / Piped water to yard/plot',
        label: 'Branchement ONEA',
        order: 1,
        translations: [
          {
            language: 'fr',
            name: 'Branchement ONEA',
          },
        ],
      },
      {
        id: 1681108456317,
        code: 'C21B',
        name: 'Borehole',
        label: 'Forage',
        order: 2,
        translations: [
          {
            language: 'fr',
            name: 'Forage',
          },
        ],
      },
      {
        id: 1681108556330,
        code: 'C21C',
        name: 'Modern well',
        label: 'Puits Moderne',
        order: 3,
        translations: [
          {
            language: 'fr',
            name: 'Puits Moderne',
          },
        ],
      },
      {
        id: 1681108565845,
        code: 'C21D',
        name: 'Traditional well',
        label: 'Puits Traditionnel',
        order: 4,
        translations: [
          {
            language: 'fr',
            name: 'Puits Traditionnel',
          },
        ],
      },
    ];

    const activeLang = 'fr';

    const { getByTestId, getByText } = render(
      <TypeOption
        lang={activeLang}
        onChange={onChangeMock}
        value={values}
        option={option}
        setFieldValue={setFieldValueMock}
        id="maindrinking"
        label="What is the main drinking water point provided by the school?"
      />,
    );

    const dropdownEl = getByTestId('type-option-dropdown');
    expect(dropdownEl).toBeDefined();

    fireEvent.press(dropdownEl);

    expect(getByText('Branchement ONEA')).toBeDefined();
    expect(getByText('Puits Moderne')).toBeDefined();
    expect(getByText('Puits Traditionnel')).toBeDefined();

    const choosedOpt = getByText('Forage');
    await waitFor(() => expect(choosedOpt).toBeDefined());

    fireEvent.press(choosedOpt);

    act(() => {
      onChangeMock('maindrinking', ['Borehole']);
    });

    await waitFor(() => {
      expect(onChangeMock).toHaveBeenNthCalledWith(2, 'maindrinking', ['Borehole']);
    });
  });

  it('should not show required sign if required param is false and requiredSign is not defined', () => {
    const wrapper = render(<TypeOption id="dropdownField" label="Dropdown" required={false} />);
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should not show required sign if required param is false but requiredSign is defined', () => {
    const wrapper = render(
      <TypeOption id="dropdownField" label="Dropdown" required={false} requiredSign="*" />,
    );
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeFalsy();
  });

  it('should not show required sign if required param is true and requiredSign defined', () => {
    const wrapper = render(
      <TypeOption id="dropdownField" label="Dropdown" required requiredSign="*" />,
    );
    const requiredIcon = wrapper.queryByTestId('field-required-icon');
    expect(requiredIcon).toBeTruthy();
  });

  it('should show required sign with custom requiredSign', () => {
    const wrapper = render(
      <TypeOption id="dropdownField" label="Dropdown" required requiredSign="**" />,
    );
    const requiredIcon = wrapper.getByText('**');
    expect(requiredIcon).toBeTruthy();
  });
});
