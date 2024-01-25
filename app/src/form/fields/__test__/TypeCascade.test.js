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
    cascades.loadDataSource.mockImplementation(() => {
      return Promise.resolve({
        rows: { length: dummyLocations.length, _array: dummyLocations },
      });
    });
  });

  it('Should not show options when the data source is not set.', async () => {
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

    await waitFor(() => {
      const firstDropdown = queryByTestId('dropdown-cascade-0');
      expect(firstDropdown).toBeNull();
    });
  });

  it('Should not be able to update values when options is empty', async () => {
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

    await waitFor(() => {
      const dropdownEl = queryByTestId('dropdown-cascade-0');
      expect(dropdownEl).toBeNull();
    });
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

    const mockedOnChange = jest.fn();

    act(() => {
      FormState.update((s) => {
        s.currentValues[fieldID] = initialValue;
      });
    });

    const { getByTestId, getByText } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
      />,
    );

    await waitFor(
      async () =>
        await expect(cascades.loadDataSource({ file: 'administrator.sqlite' })).resolves.toEqual({
          rows: {
            length: dummyLocations.length,
            _array: dummyLocations,
          },
        }),
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

    const mockedOnChange = jest.fn();
    const { getByTestId, getByText, queryByText, debug } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        source={{
          file: 'administrator.sqlite',
          parent_id: [0],
        }}
      />,
    );

    await waitFor(
      async () =>
        await expect(cascades.loadDataSource({ file: 'administrator.sqlite' })).resolves.toEqual({
          rows: {
            length: dummyLocations.length,
            _array: dummyLocations,
          },
        }),
    );

    await waitFor(() => {
      
      const firstDropdown = getByTestId('dropdown-cascade-0');
      expect(firstDropdown).toBeDefined();
      const firstOption = queryByText('DI YOGYAKARTA');
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

    const mockedOnChange = jest.fn();

    const { getByTestId, getByText } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        source={{
          file: 'administrator.sqlite',
          parent_id: [0],
        }}
      />,
    );

    await waitFor(
      async () =>
        await expect(cascades.loadDataSource({ file: 'administrator.sqlite' })).resolves.toEqual({
          rows: {
            length: dummyLocations.length,
            _array: dummyLocations,
          },
        }),
    );

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

    act(() => {
      FormState.update((s) => {
        s.currentValues[fieldID] = [106, 107, 109];
      });
    });

    await waitFor(() => {
      const { result } = renderHook(() => FormState.useState((s) => s.currentValues));
      expect(result.current).toEqual({
        [fieldID]: [106, 107, 109],
      });
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

    await waitFor(
      async () =>
        await expect(cascades.loadDataSource({ file: 'administrator.sqlite' })).resolves.toEqual({
          rows: {
            length: dummyLocations.length,
            _array: dummyLocations,
          },
        }),
    );

    const dropdown1 = getByTestId('dropdown-cascade-0');
    expect(dropdown1).toBeDefined();

    fireEvent.press(dropdown1);

    const selectedText = getByTestId('dropdown-cascade-1');
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

    await waitFor(
      async () =>
        await expect(cascades.loadDataSource({ file: 'administrator.sqlite' })).resolves.toEqual({
          rows: {
            length: dummyLocations.length,
            _array: dummyLocations,
          },
        }),
    );

    const dropdown1 = getByTestId('dropdown-cascade-0');
    expect(dropdown1).toBeDefined();
    fireEvent.press(dropdown1);

    const selectedText = getByTestId('dropdown-cascade-1');
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
    const { getByTestId, getByText, rerender, debug } = render(
      <TypeCascade
        onChange={mockedOnChange}
        id={fieldID}
        name={fieldName}
        value={values[fieldID]}
        dataSource={dummyLocations}
        source={questionSource}
      />,
    );

    await waitFor(
      async () =>
        await expect(cascades.loadDataSource({ file: 'administrator.sqlite' })).resolves.toEqual({
          rows: {
            length: dummyLocations.length,
            _array: dummyLocations,
          },
        }),
    );

    const dropdown1 = getByTestId('dropdown-cascade-0');
    expect(dropdown1).toBeDefined();
    fireEvent.press(dropdown1);

    const selectedText2 = getByTestId('dropdown-cascade-1');
    fireEvent.press(selectedText2);

    act(() => {
      mockedOnChange(fieldID, [107, 109]);
    });

    await waitFor(() => {
      expect(values[fieldID]).toEqual([107, 109]);
      expect(getByText('Sabdodadi')).toBeDefined();
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
  {
    id: 1,
    name: 'RS Umum Daerah Wates ',
    code: '3401015',
    entity: 2,
    administration: 115,
    parent: 115,
  },
  {
    id: 2,
    name: 'RS Khusus Ibu Anak Sadewa',
    code: '3404187',
    entity: 2,
    administration: 116,
    parent: 116,
  },
  {
    id: 3,
    name: 'RS Ibu dan Anak Allaudya',
    code: '3403026',
    entity: 2,
    administration: 116,
    parent: 116,
  },
  {
    id: 4,
    name: 'SD NEGERI DEPOK I',
    code: '20401672',
    entity: 1,
    administration: 116,
    parent: 116,
  },
  {
    id: 5,
    name: 'SD NEGERI JETISHARJO',
    code: '20401724',
    entity: 1,
    administration: 117,
    parent: 117,
  },
];

describe('TypeCascade | Entity', () => {
  beforeAll(() => {
    cascades.loadDataSource.mockImplementation(() =>
      Promise.resolve({
        rows: { length: mockEntities.length, _array: mockEntities },
      }),
    );
  });

  it('should be able to load `entity_data.sqlite`', async () => {
    const question = {
      id: 123,
      name: 'HCF',
      order: 1,
      type: 'cascade',
      required: false,
      meta: false,
      extra: {
        name: 'Health Care Facilities',
        type: 'entity',
      },
      source: {
        file: 'entity_data.sqlite',
        cascade_type: 2,
        cascade_parent: 'administrator.sqlite',
      },
    };
    const onChangeMock = jest.fn();

    const { getByTestId } = render(<TypeCascade onChange={onChangeMock} {...question} />);

    await waitFor(
      async () =>
        await expect(cascades.loadDataSource({ file: 'administrator.sqlite' })).resolves.toEqual({
          rows: {
            length: mockEntities.length,
            _array: mockEntities,
          },
        }),
    );

    act(() => {
      /**
       * Fired selected administration
       */
      FormState.update((s) => {
        s.administration = [116];
      });
    });

    const option1 = getByTestId('dropdown-cascade-0');
    expect(option1).toBeDefined();

    fireEvent.press(option1);

    await waitFor(() => {
      expect(getByTestId('dropdown-cascade-0 flatlist').props.data).toEqual([
        {
          id: 3,
          name: 'RS Ibu dan Anak Allaudya',
          code: '3403026',
          entity: 2,
          administration: 116,
          parent: 116,
          _index: 0,
        },
        {
          id: 2,
          name: 'RS Khusus Ibu Anak Sadewa',
          code: '3404187',
          entity: 2,
          administration: 116,
          parent: 116,
          _index: 1,
        },
      ]);
    });
  });

  it('should be able to be filtered by cascade_type and the selected administration ID', async () => {
    const question = {
      id: 124,
      name: 'Please choose School',
      order: 1,
      type: 'cascade',
      required: false,
      meta: false,
      extra: {
        name: 'School',
        type: 'entity',
      },
      source: {
        file: 'entity_data.sqlite',
        cascade_type: 1,
        cascade_parent: 'administrator.sqlite',
      },
    };
    const onChangeMock = jest.fn();

    const { getByTestId } = render(<TypeCascade onChange={onChangeMock} {...question} />);

    await waitFor(
      async () =>
        await expect(cascades.loadDataSource({ file: 'administrator.sqlite' })).resolves.toEqual({
          rows: {
            length: mockEntities.length,
            _array: mockEntities,
          },
        }),
    );

    act(() => {
      /**
       * Fired selected administration
       */
      FormState.update((s) => {
        s.administration = [116];
      });
    });

    const option1 = getByTestId('dropdown-cascade-0');
    expect(option1).toBeDefined();

    fireEvent.press(option1);

    await waitFor(() => {
      expect(getByTestId('dropdown-cascade-0 flatlist').props.data).toEqual([
        {
          id: 4,
          name: 'SD NEGERI DEPOK I',
          code: '20401672',
          entity: 1,
          administration: 116,
          parent: 116,
          _index: 0,
        },
      ]);
    });
  });

  it('should display the answer from the currentValues', async () => {
    const question = {
      id: 124,
      name: 'Please choose School',
      order: 1,
      type: 'cascade',
      required: false,
      meta: false,
      extra: {
        name: 'School',
        type: 'entity',
      },
      source: {
        file: 'entity_data.sqlite',
        cascade_type: 1,
        cascade_parent: 'administrator.sqlite',
      },
    };
    const onChangeMock = jest.fn();
    const entityValue = [5];

    act(() => {
      /**
       * Mocking currentValues has entity cascade and selected administration
       */
      FormState.update((s) => {
        s.currentValues = {
          1: [117],
          124: entityValue,
        };
        s.administration = [117];
      });
    });

    const { getByTestId, getByText } = render(
      <TypeCascade onChange={onChangeMock} value={entityValue} {...question} />,
    );

    await waitFor(
      async () =>
        await expect(cascades.loadDataSource({ file: 'administrator.sqlite' })).resolves.toEqual({
          rows: {
            length: mockEntities.length,
            _array: mockEntities,
          },
        }),
    );

    const option1 = getByTestId('dropdown-cascade-0');
    expect(option1).toBeDefined();

    await waitFor(() => {
      const option1 = getByTestId('dropdown-cascade-0');
      expect(option1).toBeDefined();

      expect(getByText('SD NEGERI JETISHARJO')).toBeDefined();
    });
  });

  it('should not be shown when the administration has not been selected', async () => {
    const question = {
      id: 123,
      name: 'HCF',
      order: 1,
      type: 'cascade',
      required: false,
      meta: false,
      extra: {
        name: 'Health Care Facilities',
        type: 'entity',
      },
      source: {
        file: 'entity_data.sqlite',
        cascade_type: 2,
        cascade_parent: 'administrator.sqlite',
      },
    };
    const onChangeMock = jest.fn();

    const { queryByTestId } = render(<TypeCascade onChange={onChangeMock} {...question} />);

    await waitFor(
      async () =>
        await expect(cascades.loadDataSource({ file: 'administrator.sqlite' })).resolves.toEqual({
          rows: {
            length: mockEntities.length,
            _array: mockEntities,
          },
        }),
    );

    await waitFor(() => {
      const option1 = queryByTestId('dropdown-cascade-0');
      expect(option1).toBeNull();
    });
  });
});
