import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TypeAutofield from '../TypeAutofield';

describe('TypeAutofield component', () => {
  test('it gives the correct value', () => {
    const onChangeMock = jest.fn();
    const values = {
      1: 2,
      2: 3,
    };
    const id = 3;
    const name = 'Auto Field';
    const fn = {
      fnString: 'function() {return #1 * #2}',
    };

    const { getByText, getByTestId } = render(
      <TypeAutofield onChange={onChangeMock} values={values} id={id} name={name} fn={fn} />,
    );

    const autoFieldLabel = getByText(`1. ${name}`);
    expect(autoFieldLabel).toBeDefined();

    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe('6');
    expect(onChangeMock).toHaveBeenCalledTimes(1);
  });

  test('it gives null value', () => {
    const onChangeMock = jest.fn();
    const values = {
      1: 2,
      2: ['A', 'B'],
    };
    const id = 3;
    const name = 'Auto Field';
    const fn = {
      fnString: 'function() {return #2.includes("A") ? #1 : #1 * 2}',
    };
    const { getByTestId } = render(
      <TypeAutofield onChange={onChangeMock} values={values} id={id} name={name} fn={fn} />,
    );
    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe('2');
  });

  test('it gives corect geo location and option value', () => {
    const onChangeMock = jest.fn();
    const values = {
      1: { lat: 1, lng: 2 },
      2: ['A', 'B'],
      3: 2,
    };
    const id = 3;
    const name = 'Auto Field';
    const fn = {
      fnString: '() => #3 > 1 ? #1 + "&" + #2 : null',
    };
    const { getByTestId } = render(
      <TypeAutofield onChange={onChangeMock} values={values} id={id} name={name} fn={fn} />,
    );
    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe('1,2&A,B');
  });

  test('it gives null value when value is error', () => {
    const onChangeMock = jest.fn();
    const values = {
      2: {},
      3: 2,
    };
    const id = 4;
    const name = 'Auto Field';
    const fn = {
      fnString: 'function() {return #2 + #3.split(" ");}',
    };
    const { getByTestId } = render(
      <TypeAutofield onChange={onChangeMock} values={values} id={id} name={name} fn={fn} />,
    );
    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe(null);
  });

  test('it gives error when function error', () => {
    const onChangeMock = jest.fn();
    const values = {};
    const id = 4;
    const name = 'Auto Field';
    const fn = {
      fnString: '() => #4',
    };
    const { getByTestId } = render(
      <TypeAutofield onChange={onChangeMock} values={values} id={id} name={name} fn={fn} />,
    );
    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe(null);
  });

  test('it gives error when function error', () => {
    const onChangeMock = jest.fn();
    const values = {};
    const id = 4;
    const name = 'Auto Field';
    const fn = {
      fnString: '',
    };
    const { getByTestId } = render(
      <TypeAutofield onChange={onChangeMock} values={values} id={id} name={name} fn={fn} />,
    );
    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe(null);
  });

  test('it supports the logical operator: AND', () => {
    const onChangeMock = jest.fn();
    const values = {
      1: 'G1',
      2: 'G0',
    };
    const id = 3;
    const name = 'Auto Field';
    const fn = {
      fnString: 'function() { return #1.includes("G0") && #2.includes("G0") ? "G0" : "G1" }',
    };

    const { getByTestId } = render(
      <TypeAutofield onChange={onChangeMock} values={values} id={id} name={name} fn={fn} />,
    );

    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe('G1');
  });

  test('it supports the logical operator: OR', () => {
    const onChangeMock = jest.fn();
    const values = {
      1: 'G1',
      2: 'G0',
    };
    const id = 3;
    const name = 'Auto Field';
    const fn = {
      fnString: 'function() { return #1.includes("G0") || #2.includes("G0") ? "G0" : "G1" }',
    };

    const { getByTestId } = render(
      <TypeAutofield onChange={onChangeMock} values={values} id={id} name={name} fn={fn} />,
    );

    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe('G0');
  });

  test('it supports to generate UUID', () => {
    const onChangeMock = jest.fn();
    const values = {
      517600060: [9.123673412317656, 40.50754409565747],
      608880002: 'Village name',
    };
    const id = 3;
    const name = 'Auto Field';
    const fn = {
      fnString:
        "function(){ return #517600060 && #608880002 ? #608880002.replace(' ','-').replace(',','-') + '-' + #517600060.replace('-','').replace(',','.').split('.').reduce((x, y) => parseInt(x) + parseInt(y), 0).toString(32).substring(3,7) : null}",
    };

    const { getByTestId } = render(
      <TypeAutofield onChange={onChangeMock} values={values} id={id} name={name} fn={fn} />,
    );

    const autoField = getByTestId('type-autofield');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe('Village-name-gi5p');
  });

  test('it gives background color when fnColor is defined and cover all possible outputs', () => {
    const onChangeMock = jest.fn();
    const values = {
      1: 'G1',
      2: 'G0',
    };
    const id = 3;
    const name = 'Auto Field';
    const fn = {
      fnString: 'function() { return #1.includes("G0") || #2.includes("G0") ? "G0" : "G1" }',
      fnColor: {
        G0: '#FECDCD',
        G1: '#CCFFC4',
      },
    };

    const { getByTestId } = render(
      <TypeAutofield onChange={onChangeMock} values={values} id={id} name={name} fn={fn} />,
    );

    const autoField = getByTestId('type-autofield');
    const autoFieldWrapper = getByTestId('type-autofield-wrapper');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe('G0');
    expect(autoFieldWrapper.children[1].props.inputContainerStyle.backgroundColor).toBe('#FECDCD');
  });

  test("it gives default background color when fnColor is defined but doesn't cover all possible outputs", () => {
    const defaultColor = '#f2f2f2';
    const onChangeMock = jest.fn();
    const values = {
      1: 'G0',
      2: 'G0',
    };
    const id = 3;
    const name = 'Auto Field';
    const fn = {
      fnString: 'function() { return #1.includes("G0") && #2.includes("G0") ? "G0" : "G1" }',
      fnColor: {
        G1: '#FECDCD',
        G2: '#CCFFC4',
      },
    };

    const { getByTestId } = render(
      <TypeAutofield onChange={onChangeMock} values={values} id={id} name={name} fn={fn} />,
    );

    const autoField = getByTestId('type-autofield');
    const autoFieldWrapper = getByTestId('type-autofield-wrapper');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBe('G0');
    expect(autoFieldWrapper.children[1].props.inputContainerStyle.backgroundColor).toBe(
      defaultColor,
    );
  });

  test('it gives default background color when fnColor is defined but fnString is empty', () => {
    const defaultColor = '#f2f2f2';
    const onChangeMock = jest.fn();
    const values = {
      1: 'G0',
      2: 'G0',
    };
    const id = 3;
    const name = 'Auto Field';
    const fn = {
      fnString: '',
      fnColor: {
        G1: '#FECDCD',
        G2: '#CCFFC4',
      },
    };

    const { getByTestId } = render(
      <TypeAutofield onChange={onChangeMock} values={values} id={id} name={name} fn={fn} />,
    );

    const autoField = getByTestId('type-autofield');
    const autoFieldWrapper = getByTestId('type-autofield-wrapper');
    expect(autoField).toBeDefined();
    expect(autoField.props.value).toBeNull();
    expect(autoFieldWrapper.children[1].props.inputContainerStyle.backgroundColor).toBe(
      defaultColor,
    );
  });
});
