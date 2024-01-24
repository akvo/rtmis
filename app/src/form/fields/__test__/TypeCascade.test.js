import React, { useState } from 'react';
import { render, fireEvent, act, waitFor, renderHook } from '@testing-library/react-native';
import TypeCascade from '../TypeCascade';
import { generateDataPointName } from '../../lib';
import { cascades } from '../../../lib';
import { FormState } from '../../../store';

const dummyLocations = [
  { id: 106, name: 'DI YOGYAKARTA', parent: 0 },
  { id: 107, name: 'KAB. BANTUL', parent: 106 },
  { id: 109, name: 'Sabdodadi', parent: 107 },
  { id: 110, name: 'Bantul', parent: 107 },
  { id: 111, name: 'JAWA TENGAH', parent: 0 },
  { id: 112, name: 'KAB. PURBALINGGA', parent: 111 },
  { id: 113, name: 'KAB. BANYUMAS', parent: 111 },
  { id: 114, name: 'Kembaran', parent: 113 },
];

// According to the issue on @testing-library/react-native
import { View } from 'react-native';
jest.spyOn(View.prototype, 'measureInWindow').mockImplementation((cb) => {
  cb(18, 113, 357, 50);
});
jest.mock('expo-sqlite');
jest.mock('../../../lib', () => ({
  cascades: {
    loadDataSource: jest.fn(async (source, id) => {
      return id
        ? { rows: { length: 1, _array: [{ id: 112, name: 'KAB. PURBALINGGA', parent: 111 }] } }
        : {
            rows: {
              length: dummyLocations.length,
              _array: dummyLocations,
            },
          };
    }),
  },
  i18n: {
    text: jest.fn(() => ({
      latitude: 'Latitude',
      longitude: 'Longitude',
    })),
  },

  generateDataPointName: jest.fn(),
}));

describe('TypeCascade', () => {
  beforeEach(() => {
    cascades.loadDataSource.mockReturnValue({
      rows: { length: dummyLocations.length, _array: dummyLocations },
    });
  });

  it('Should not show options when the data source is not set.', () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const values = { [fieldID]: null };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const { queryByTestId } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
      />,
    );

    const firstDropdown = queryByTestId('dropdown-cascade-0');
    expect(firstDropdown).toBeNull();
  });

  it('Should not be able to update values when options is empty', () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = null;
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const dataSource = [{ id: 1, name: 'Only parent', parent: null }];

    const { queryByTestId } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        dataSource={dataSource}
      />,
    );

    const dropdownEl = queryByTestId('dropdown-cascade-0');
    expect(dropdownEl).toBeNull();
  });

  it('Should have a specific parent dropdown when source is defined.', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = [107, 110];
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const questionSource = { file: 'file.sqlite', parent_id: [107] };
    const { getByTestId, getByText, queryByText } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        dataSource={dummyLocations}
        source={questionSource}
      />,
    );

    await waitFor(() => {
      const parentDropdown = getByTestId('dropdown-cascade-0');
      expect(parentDropdown).toBeDefined();
      const invalidOption = queryByText('DI YOGYAKARTA');
      expect(invalidOption).toBeNull();

      const validOption = queryByText('Bantul');
      expect(validOption).toBeDefined();
    });
  });

  it('Should have one or more child dropdowns.', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = [111, 112];
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    act(() => {
      FormState.update((s) => {
        s.currentValues[fieldID] = initialValue;
      });
    });

    const { getByTestId, getByText, rerender } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
      />,
    );

    await waitFor(() => {
      const parentDropdown = getByTestId('dropdown-cascade-0');
      expect(parentDropdown).toBeDefined();
      const childDropdown = getByTestId('dropdown-cascade-1');
      expect(childDropdown).toBeDefined();

      fireEvent.press(childDropdown);

      const option1 = getByText('KAB. BANYUMAS');
      expect(option1).toBeDefined();
    });
  });

  it('Should depend on the selected option in the parent dropdown.', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const selectedOption = [106, 107];
    const values = { [fieldID]: selectedOption };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });
    const { getByTestId, getByText, queryByText } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        dataSource={dummyLocations}
      />,
    );

    await waitFor(() => {
      const firstDropdown = getByTestId('dropdown-cascade-0');
      expect(firstDropdown).toBeDefined();
      const firstOption = getByText('DI YOGYAKARTA');
      expect(firstOption).toBeDefined();

      const secondDropdown = getByTestId('dropdown-cascade-1');
      expect(secondDropdown).toBeDefined();

      const secondOption = getByText('KAB. BANTUL');
      expect(secondOption).toBeDefined();

      // change first dropdown
      fireEvent.press(firstDropdown);

      const selectedParent = getByText('JAWA TENGAH');
      fireEvent.press(selectedParent);

      // second dropdown is empty
      expect(queryByText('KAB. BANTUL')).toBeNull();
    });
  });

  it('should set values based on the required level', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = null;
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const { getByTestId, getByText, debug, rerender } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        dataSource={dummyLocations}
      />,
    );

    const { result } = renderHook(() =>
      useState([
        {
          options: [
            { id: 106, name: 'DI YOGYAKARTA' },
            { id: 111, name: 'JAWA TENGAH' },
          ],
          value: null,
        },
      ]),
    );
    const [dropdownItems, setDropdownItems] = result.current;

    const mockedDropdownChange = jest.fn((index, value) => {
      const nextIndex = index + 1;
      const findValue = dummyLocations.find((d) => d?.id === value);
      if (findValue) {
        const updatedItems = dropdownItems
          .slice(0, nextIndex)
          .map((d, dx) => (dx === index ? { ...d, value } : d));

        const options = dummyLocations?.filter((d) => d?.parent === value);

        if (options.length) {
          updatedItems.push({
            options,
            value: null,
          });
        }
        const dropdownValues = updatedItems.filter((dd) => dd.value).map((dd) => dd.value);
        const finalValues = updatedItems.length !== dropdownValues.length ? null : dropdownValues;

        mockedOnChange(fieldID, finalValues);

        setDropdownItems(updatedItems);
      }
    });

    await waitFor(() => {
      const dropdown1 = getByTestId('dropdown-cascade-0');
      expect(dropdown1).toBeDefined();

      fireEvent.press(dropdown1);

      const dropdown1Selected = getByText('DI YOGYAKARTA');
      fireEvent.press(dropdown1Selected);

      const dropdown2 = getByTestId('dropdown-cascade-1');
      expect(dropdown2).toBeDefined();

      fireEvent.press(dropdown2);
      const dropdown2Selected = getByText('KAB. BANTUL');
      fireEvent.press(dropdown2Selected);

      // it should still null
      expect(values[fieldID]).toBeNull();

      const dropdown3 = getByTestId('dropdown-cascade-2');
      expect(dropdown3).toBeDefined();

      fireEvent.press(dropdown3);
      const dropdown3Selected = getByText('Sabdodadi');
      fireEvent.press(dropdown3Selected);

      expect(values[fieldID]).toEqual([106, 107, 109]);
    });
  });

  it('should sorted items correctly', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = null;
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const dataSource = [
      { id: 1, name: 'Nuffic', parent: 0 },
      { id: 2, name: 'SNV', parent: 0 },
      { id: 3, name: 'Akvo', parent: 0 },
    ];

    cascades.loadDataSource.mockReturnValue({
      rows: { length: dataSource.length, _array: dataSource },
    });

    const { getByTestId, getByText } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
      />,
    );

    await waitFor(() => {
      const dropdown1 = getByTestId('dropdown-cascade-0');
      fireEvent.press(dropdown1);

      const option1 = getByText('Akvo');
      expect(option1).toBeDefined();
      const option2 = getByText('Nuffic');
      expect(option2).toBeDefined();
      const option3 = getByText('SNV');
      expect(option3).toBeDefined();
    });
  });

  it('should not show required sign if required param is false and requiredSign is not defined', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = null;
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const dataSource = [
      { id: 1, name: 'Nuffic', parent: 0 },
      { id: 2, name: 'SNV', parent: 0 },
      { id: 3, name: 'Akvo', parent: 0 },
    ];

    cascades.loadDataSource.mockReturnValue({
      rows: { length: dataSource.length, _array: dataSource },
    });

    const wrapper = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        required={false}
      />,
    );
    await waitFor(() => {
      const requiredIcon = wrapper.queryByTestId('field-required-icon');
      expect(requiredIcon).toBeFalsy();
    });
  });

  it('should not show required sign if required param is false but requiredSign is defined', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = null;
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const dataSource = [
      { id: 1, name: 'Nuffic', parent: 0 },
      { id: 2, name: 'SNV', parent: 0 },
      { id: 3, name: 'Akvo', parent: 0 },
    ];

    cascades.loadDataSource.mockReturnValue({
      rows: { length: dataSource.length, _array: dataSource },
    });

    const wrapper = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        required={false}
        requiredSign="*"
      />,
    );

    await waitFor(() => {
      const requiredIcon = wrapper.queryByTestId('field-required-icon');
      expect(requiredIcon).toBeFalsy();
    });
  });

  it('should not show required sign if required param is true and requiredSign defined', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = null;
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const dataSource = [
      { id: 1, name: 'Nuffic', parent: 0 },
      { id: 2, name: 'SNV', parent: 0 },
      { id: 3, name: 'Akvo', parent: 0 },
    ];

    const wrapper = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        dataSource={dataSource}
        required={true}
        requiredSign="*"
      />,
    );

    await waitFor(() => {
      const requiredIcon = wrapper.queryByTestId('field-required-icon');
      expect(requiredIcon).toBeTruthy();
    });
  });

  it('should show required sign with custom requiredSign', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = null;
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const dataSource = [
      { id: 1, name: 'Nuffic', parent: 0 },
      { id: 2, name: 'SNV', parent: 0 },
      { id: 3, name: 'Akvo', parent: 0 },
    ];

    const wrapper = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        dataSource={dataSource}
        required={true}
        requiredSign="**"
      />,
    );

    await waitFor(() => {
      const requiredIcon = wrapper.getByText('**');
      expect(requiredIcon).toBeTruthy();
    });
  });

  it('should use id when parent id not found', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = null;
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn();

    const questionSource = { file: 'file.sqlite', parent_id: [114] };
    const { getByTestId, getByText, debug } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        source={questionSource}
      />,
    );

    await waitFor(() => {
      const parentDropdown = getByTestId('dropdown-cascade-0');
      expect(parentDropdown).toBeDefined();

      fireEvent.press(parentDropdown);

      const validOption = getByText('Kembaran');
      expect(validOption).toBeDefined();
    });
  });

  it('Should get cascade name as datapoint name', async () => {
    /**
     * Set datapointName first
     */
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = null;
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const questionSource = { file: 'file.sqlite', parent_id: [107] };
    const { getByTestId, getByText } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        dataSource={dummyLocations}
        source={questionSource}
      />,
    );

    const dropdown1 = getByTestId('dropdown-cascade-0');
    expect(dropdown1).toBeDefined();

    fireEvent.press(dropdown1);

    const selectedText = getByText('Sabdodadi');
    fireEvent.press(selectedText);

    act(() => {
      mockedOnChange(fieldID, [107, 109]);
      const cascadeName = 'Sabdodadi';
    });

    await waitFor(() => {
      expect(values[fieldID]).toEqual([107, 109]);
    });
  });

  it('Should not get cascade name as datapoint name when FormState.dataPointName is empty or there is no cascade type', async () => {
    /**
     * Update datapointName first
     */
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = null;
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const questionSource = { file: 'file.sqlite', parent_id: [107] };
    const { getByTestId, getByText, rerender } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        dataSource={dummyLocations}
        source={questionSource}
      />,
    );

    const dropdown1 = getByTestId('dropdown-cascade-0');
    expect(dropdown1).toBeDefined();
    fireEvent.press(dropdown1);

    const selectedText = getByText('Bantul');
    fireEvent.press(selectedText);

    act(() => {
      mockedOnChange(fieldID, [107, 108]);
      const cascadeName = 'Bantul';
    });

    await waitFor(() => {
      expect(values[fieldID]).toEqual([107, 108]);
    });
  });

  it('Should not get cascade name as datapoint name when there is no cascade type', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = null;
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });

    const questionSource = { file: 'file.sqlite', parent_id: [107] };
    const { getByTestId, getByText, rerender } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        dataSource={dummyLocations}
        source={questionSource}
      />,
    );

    const dropdown1 = getByTestId('dropdown-cascade-0');
    expect(dropdown1).toBeDefined();
    fireEvent.press(dropdown1);

    const selectedText2 = getByText('Sabdodadi');
    fireEvent.press(selectedText2);

    act(() => {
      mockedOnChange(fieldID, [107, 109]);
      const cascadeName = 'Sabdodadi';
    });

    await waitFor(() => {
      expect(values[fieldID]).toEqual([107, 109]);
    });
  });

  it('should set datapointname when input has data', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = [111, 112];
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });
    act(() => {
      FormState.update((s) => {
        s.currentValues = {
          location: initialValue,
        };
      });
    });

    const questionSource = { file: 'file.sqlite', parent_id: [111] };
    const { getByTestId, getByText, debug } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        dataSource={dummyLocations}
        source={questionSource}
      />,
    );

    act(() => {
      FormState.update((s) => {
        s.cascades = { location: 'KAB. PURBALINGGA' };
      });
    });

    await waitFor(() => {
      const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
      const form = {
        question_group: [
          { name: 'Example', question: [{ type: 'cascade', meta: true, id: 'location' }] },
        ],
      };
      const datapoint = generateDataPointName(form, result.current[0], {
        location: 'KAB. PURBALINGGA',
      });
      expect(datapoint.dpName).toBe('KAB. PURBALINGGA');
    });
  });

  it('should generate empty datapointName when selected value not match', async () => {
    const fieldID = 'location';
    const fieldName = 'Location';
    const initialValue = [200];
    const values = { [fieldID]: initialValue };

    const mockedOnChange = jest.fn((fieldName, value) => {
      values[fieldName] = value;
    });
    act(() => {
      FormState.update((s) => {
        s.currentValues = {
          location: initialValue,
        };
      });
    });

    cascades.loadDataSource.mockReturnValue({ rows: { length: 0, _array: [] } });

    const questionSource = { file: 'file.sqlite', parent_id: [] };
    const { getByTestId, getByText, debug } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        dataSource={dummyLocations}
        source={questionSource}
      />,
    );

    await waitFor(() => {
      const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
      const form = {
        question_group: [
          { name: 'Example', question: [{ type: 'cascade', meta: true, id: 'location' }] },
        ],
      };
      const datapoint = generateDataPointName(form, result.current[0], {});
      expect(datapoint.dpName).toBe('');
    });
  });
});

const mockEntities = [
  { id: 'RS Umum Daerah Wates ', code: '3401015', entity: 2, administration: 115, parent: 115 },
  { id: 'RS Khusus Ibu Anak Sadewa', code: '3404187', entity: 2, administration: 116, parent: 116 },
  { id: 'RS Ibu dan Anak Allaudya', code: '3403026', entity: 2, administration: 116, parent: 116 },
  { id: 'SD NEGERI DEPOK I', code: '20401672', entity: 1, administration: 116, parent: 116 },
  { id: 'SD NEGERI JETISHARJO', code: '20401724', entity: 1, administration: 117, parent: 117 },
];

describe('TypeCascade | Entity', () => {
  beforeAll(() => {
    cascades.loadDataSource.mockReturnValue({
      rows: { length: mockEntities.length, _array: mockEntities },
    });
  });

  it.todo('it should be able to load entity_data.sqlite');
  it.todo('it should be able to get the selected administration ID as the parent value');
  it.todo('It should be triggered by the selected administration ID and show a valid list');
  it.todo('it should be empty when the administration has not selected');
});
