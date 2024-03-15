import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import TypeAutofield from '../TypeAutofield';
import { FormState } from '../../../store';

describe('TypeAutofield component', () => {
  test('it gives the correct value', () => {
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
      fnString: '#1 * #2',
    };

    const { getByText, getByTestId } = render(
      <TypeAutofield id={id} label={name} fn={fn} keyform={0} />,
    );

    const autoFieldLabel = getByText(`1. ${name}`);
    expect(autoFieldLabel).toBeDefined();

    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe('6');
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
});
