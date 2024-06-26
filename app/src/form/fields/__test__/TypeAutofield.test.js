import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import TypeAutofield from '../TypeAutofield';
import { FormState } from '../../../store';

describe('TypeAutofield component', () => {
  beforeAll(() => {
    FormState.update((s) => {
      s.surveyStart = '2024-06-26-14.50.35.123';
    });
  });

  test('it gives the correct value', () => {
    const mockFormQuestions = [
      {
        name: 'household_location',
        label: 'HOUSEHOLD: Location',
        question: [
          {
            id: 1,
            order: 1,
            name: 'total_male',
            label: 'Total Male',
            type: 'number',
          },
          {
            id: 2,
            order: 2,
            name: 'total_female',
            label: 'Total Female',
            type: 'number',
          },
        ],
      },
    ];
    const values = {
      1: 2,
      2: 3,
    };
    act(() => {
      FormState.update((s) => {
        s.currentValues = values;
      });
    });
    const id = 3;
    const name = 'Auto Field';
    const fn = {
      fnString: '#total_male# + #total_female#',
    };

    const { getByText, getByTestId } = render(
      <TypeAutofield id={id} label={name} fn={fn} keyform={1} questions={mockFormQuestions} />,
    );

    const autoFieldLabel = getByText(`1. ${name}`);
    expect(autoFieldLabel).toBeDefined();

    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe('5');
  });

  test('it gives null value', () => {
    const values = {
      1: 2,
      2: ['A', 'B'],
    };
    act(() => {
      FormState.update((s) => {
        s.currentValues = values;
      });
    });
    const id = 3;
    const name = 'Auto Field';
    const fn = {
      fnString: '#2.includes("A") ? #1 : #1 * 2',
    };
    const { getByTestId } = render(<TypeAutofield id={id} label={name} fn={fn} keyform={1} />);
    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe('2');
  });

  test('it gives null value when value is error', () => {
    const values = {
      2: {},
      3: 2,
    };
    act(() => {
      FormState.update((s) => {
        s.currentValues = values;
      });
    });
    const id = 4;
    const name = 'Auto Field';
    const fn = {
      fnString: 'function() {return #2 + #3.split(" ");}',
    };
    const { getByTestId } = render(<TypeAutofield id={id} label={name} fn={fn} keyform={1} />);
    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe(null);
  });

  test('it gives error when function error', () => {
    const values = {};
    act(() => {
      FormState.update((s) => {
        s.currentValues = values;
      });
    });
    const id = 4;
    const name = 'Auto Field';
    const fn = {
      fnString: '() => #4',
    };
    const { getByTestId } = render(<TypeAutofield id={id} label={name} fn={fn} keyform={1} />);
    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe(null);
  });

  test('it gives error when function error', () => {
    const values = {};
    act(() => {
      FormState.update((s) => {
        s.currentValues = values;
      });
    });
    const id = 4;
    const name = 'Auto Field';
    const fn = {
      fnString: '',
    };
    const { getByTestId } = render(<TypeAutofield id={id} label={name} fn={fn} keyform={1} />);
    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe(null);
  });

  test('it gives the correct value after name to ID replacement', async () => {
    const mockFormQuestions = [
      {
        name: 'household_location',
        label: 'HOUSEHOLD: Location',
        question: [
          {
            id: 11,
            order: 1,
            name: 'qty',
            label: 'Quantity',
            short_label: 'qty',
            type: 'number',
          },
        ],
      },
    ];

    act(() => {
      FormState.update((s) => {
        s.currentValues = {
          11: 2,
        };
      });
    });

    const { getByTestId } = render(
      <TypeAutofield
        id="12"
        name="autofield"
        label="Auto Field"
        fn={{
          fnString: '#qty# * 2000',
        }}
        questions={mockFormQuestions}
        keyform={1}
      />,
    );

    await waitFor(() => {
      const autoField = getByTestId('type-autofield');
      expect(autoField).toBeDefined();
      expect(autoField.props.value).toBe('4000');
    });
  });

  test('it gives the correct values when some answers are undefined', async () => {
    const mockFormQuestions = [
      {
        id: 1,
        name: 'summary',
        label: 'Summary',
        question: [
          {
            id: 11,
            order: 1,
            name: 'institution_type',
            label: 'Type of institution',
            type: 'multiple_option',
            options: [
              {
                id: 111,
                order: 1,
                label: 'School',
                value: 'school',
              },
              {
                id: 112,
                order: 2,
                label: 'Health Care Facilities',
                value: 'hcf',
              },
              {
                id: 113,
                order: 3,
                label: 'Public toilets',
                value: 'public_toilet',
              },
            ],
          },
          {
            id: 12,
            order: 2,
            name: 'total_schools',
            label: 'Total schools',
            type: 'number',
            dependency: [
              {
                id: 11,
                options: ['school'],
              },
            ],
          },
          {
            id: 13,
            order: 3,
            name: 'total_hcf',
            label: 'Total health facilities',
            type: 'number',
            dependency: [
              {
                id: 11,
                options: ['hcf'],
              },
            ],
          },
          {
            id: 14,
            order: 4,
            name: 'total_public_toilets',
            label: 'Total public toilets',
            type: 'number',
            dependency: [
              {
                id: 11,
                options: ['public_toilet'],
              },
            ],
          },
        ],
      },
    ];

    act(() => {
      FormState.update((s) => {
        s.currentValues = {
          11: ['school', 'public_toilet'],
          12: 3,
          14: 1,
        };
      });
    });

    const { getByTestId } = render(
      <TypeAutofield
        id="15"
        name="total_institutions"
        label="Total institutions"
        fn={{
          fnString: '#total_schools# + #total_hcf# + #total_public_toilets#',
        }}
        questions={mockFormQuestions}
        keyform={1}
      />,
    );

    await waitFor(() => {
      const autoField = getByTestId('type-autofield');
      expect(autoField).toBeDefined();
      expect(autoField.props.value).toBe('4');
    });
  });
});
