import React from 'react';
import { render } from '@testing-library/react-native';
import TypeAutofield from '../TypeAutofield';
import { act } from 'react-test-renderer';
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
      fnString: 'function() {return #1 * #2}',
    };

    const { getByText, getByTestId } = render(<TypeAutofield id={id} label={name} fn={fn} />);

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
      fnString: 'function() {return #2.includes("A") ? #1 : #1 * 2}',
    };
    const { getByTestId } = render(<TypeAutofield id={id} label={name} fn={fn} />);
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
    const { getByTestId } = render(<TypeAutofield id={id} label={name} fn={fn} />);
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
    const { getByTestId } = render(<TypeAutofield id={id} label={name} fn={fn} />);
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
    const { getByTestId } = render(<TypeAutofield id={id} label={name} fn={fn} />);
    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe(null);
  });

  // test('it supports the logical operator: AND', () => {
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     1: 'G1',
  //     2: 'G0',
  //   };
  //   act(() => {
  //     FormState.update((s) => {
  //       s.currentValues = values;
  //     });
  //   });
  //   const id = 3;
  //   const name = 'Auto Field';
  //   const fn = {
  //     fnString: 'function() { return #1.includes("G0") && #2.includes("G0") ? "G0" : "G1" }',
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('G1');
  // });

  // test('it supports the logical operator: OR', () => {
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     1: 'G1',
  //     2: 'G0',
  //   };
  //   act(() => {
  //     FormState.update((s) => {
  //       s.currentValues = values;
  //     });
  //   });
  //   const id = 3;
  //   const name = 'Auto Field';
  //   const fn = {
  //     fnString: 'function() { return #1.includes("G0") || #2.includes("G0") ? "G0" : "G1" }',
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('G0');
  // });

  // test('it supports generating UUID by combining village name with the geo value', () => {
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     517600060: [9.123673412317656, 40.50754409565747],
  //     608880002: 'Village name',
  //   };
  //   act(() => {
  //     FormState.update((s) => {
  //       s.currentValues = values;
  //     });
  //   });
  //   const id = 3;
  //   const name = 'Auto Field';
  //   const fn = {
  //     fnString:
  //       "function(){ return #517600060 && #608880002 ? #608880002.replace(' ','-').replace(',','-') + '-' + #517600060.replace('-','').replace(',','.').split('.').reduce((x, y) => parseInt(x) + parseInt(y), 0).toString(32).substring(3,7) : null}",
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('Village-name-gi5p');
  // });

  // test('it supports generating UUID by combining the administration ID with the geo value', () => {
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     1702914753957: [9.123673412317656, 40.50754409565747],
  //     1699354849382: '123',
  //   };
  //   act(() => {
  //     FormState.update((s) => {
  //       s.currentValues = values;
  //     });
  //   });
  //   const id = 3;
  //   const name = 'Auto Field';
  //   const fn = {
  //     fnString:
  //       'function(){#1699354849382 && #1702914753957 ? String(#1699354849382).replace(\\",\\",\\"-\\") + \\"-\\" + #1702914753957.replace(\\"-\\",\\"\\").replace(\\",\\",\\".\\").split(\\".\\").reduce((x, y) => parseInt(x) + parseInt(y), 0).toString(32).substring(3,7) : null}',
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('123-gi5p');
  // });

  // test('it gives background color when fnColor is defined and cover all possible outputs', () => {
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     1: 'G1',
  //     2: 'G0',
  //   };
  //   act(() => {
  //     FormState.update((s) => {
  //       s.currentValues = values;
  //     });
  //   });
  //   const id = 3;
  //   const name = 'Auto Field';
  //   const fn = {
  //     fnString: 'function() { return #1.includes("G0") || #2.includes("G0") ? "G0" : "G1" }',
  //     fnColor: {
  //       G0: '#FECDCD',
  //       G1: '#CCFFC4',
  //     },
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   const autoFieldWrapper = getByTestId('type-autofield-wrapper');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('G0');
  //   expect(autoFieldWrapper.children[1].props.inputContainerStyle.backgroundColor).toBe('#FECDCD');
  // });

  // test("it gives default background color when fnColor is defined but doesn't cover all possible outputs", () => {
  //   const defaultColor = '#f2f2f2';
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     1: 'G0',
  //     2: 'G0',
  //   };
  //   act(() => {
  //     FormState.update((s) => {
  //       s.currentValues = values;
  //     });
  //   });
  //   const id = 3;
  //   const name = 'Auto Field';
  //   const fn = {
  //     fnString: 'function() { return #1.includes("G0") && #2.includes("G0") ? "G0" : "G1" }',
  //     fnColor: {
  //       G1: '#FECDCD',
  //       G2: '#CCFFC4',
  //     },
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   const autoFieldWrapper = getByTestId('type-autofield-wrapper');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('G0');
  //   expect(autoFieldWrapper.children[1].props.inputContainerStyle.backgroundColor).toBe(
  //     defaultColor,
  //   );
  // });

  // test('it gives default background color when fnColor is defined but fnString is empty', () => {
  //   const defaultColor = '#f2f2f2';
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     1: 'G0',
  //     2: 'G0',
  //   };
  //   act(() => {
  //     FormState.update((s) => {
  //       s.currentValues = values;
  //     });
  //   });
  //   const id = 3;
  //   const name = 'Auto Field';
  //   const fn = {
  //     fnString: '',
  //     fnColor: {
  //       G1: '#FECDCD',
  //       G2: '#CCFFC4',
  //     },
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   const autoFieldWrapper = getByTestId('type-autofield-wrapper');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBeNull();
  //   expect(autoFieldWrapper.children[1].props.inputContainerStyle.backgroundColor).toBe(
  //     defaultColor,
  //   );
  // });

  // test('it should be sum all values', () => {
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     1: '1',
  //     2: '2',
  //     3: '1',
  //     4: '4',
  //   };
  //   act(() => {
  //     FormState.update((s) => {
  //       s.currentValues = values;
  //     });
  //   });
  //   const id = 4;
  //   const name = 'Total family members';
  //   const fn = {
  //     fnString: 'function(){return #1 + #2 + #3 + #4}',
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('8');
  // });

  // test('it should be able to handle other arithmetic operations', () => {
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     1: '100',
  //     2: '2.5',
  //     3: '50',
  //     4: '2',
  //   };
  //   act(() => {
  //     FormState.update((s) => {
  //       s.currentValues = values;
  //     });
  //   });
  //   const id = 5;
  //   const name = 'Total Payment';
  //   const fn = {
  //     fnString: 'function(){return ((#1 * #2) + #3) / #4}',
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('150');
  // });

  // test('it should not show question id when some values are empty', () => {
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     1: '1',
  //     2: '2',
  //     3: '1',
  //   };
  //   act(() => {
  //     FormState.update((s) => {
  //       s.currentValues = values;
  //     });
  //   });
  //   const id = 4;
  //   const name = 'Total family members';
  //   const fn = {
  //     fnString: 'function(){return #1 + #2 + #3 + #4}',
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('4');
  // });

  // test("it should have a result even some values doesn't have value", () => {
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     1: '1',
  //     3: '1',
  //   };
  //   act(() => {
  //     FormState.update((s) => {
  //       s.currentValues = values;
  //     });
  //   });
  //   const id = 4;
  //   const name = 'Total family members';
  //   const fn = {
  //     fnString: 'function(){return #1 + #2 + #3 + #4}',
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('2');
  // });

  // test('it should produce a result when there is only one value', () => {
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     2: '1',
  //   };
  //   act(() => {
  //     FormState.update((s) => {
  //       s.currentValues = values;
  //     });
  //   });
  //   const id = 4;
  //   const name = 'Total family members';
  //   const fn = {
  //     fnString: 'function(){return #1 + #2 + #3 + #4}',
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('1');
  // });

  // test('it should not add zero when incomplete operations end with times', () => {
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     1: '3',
  //     2: '1',
  //   };
  //   const id = 4;
  //   const name = 'Total payment';
  //   const fn = {
  //     fnString: 'function(){return #1 + #2 * #3}',
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield values={values} id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('4');
  // });

  // test('it should not add zero when incomplete operations end with divider', () => {
  //   const onChangeMock = jest.fn();
  //   const values = {
  //     1: '15',
  //     2: '3',
  //   };
  //   const id = 4;
  //   const name = 'Split bill amount';
  //   const fn = {
  //     fnString: 'function(){return #1 * #2 / #3}',
  //   };

  //   const { getByTestId } = render(
  //     <TypeAutofield values={values} id={id} label={name} fn={fn} />,
  //   );

  //   const autoField = getByTestId('type-autofield');
  //   expect(autoField).toBeDefined();
  //   expect(autoField.props.value).toBe('45');
  // });
});
