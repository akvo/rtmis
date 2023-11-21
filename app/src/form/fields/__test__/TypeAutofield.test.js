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
    expect(onChangeMock).toHaveBeenCalledTimes(2);
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
});
