import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { FieldLabel } from '../support';
import { styles } from '../styles';
import { Input } from '@rneui/themed';
import { FormState } from '../../store';

const fnRegex = /^function(?:.+)?(?:\s+)?\((.+)?\)(?:\s+|\n+)?\{(?:\s+|\n+)?((?:.|\n)+)\}$/m;
const fnEcmaRegex = /^\((.+)?\)(?:\s+|\n+)?=>(?:\s+|\n+)?((?:.|\n)+)$/m;
const sanitize = [
  {
    prefix: /return fetch|fetch/g,
    re: /return fetch(\(.+)\} +|fetch(\(.+)\} +/,
    log: 'Fetch is not allowed.',
  },
];

const checkDirty = (fnString) => {
  return sanitize.reduce((prev, sn) => {
    const dirty = prev.match(sn.re);
    if (dirty) {
      return prev.replace(sn.prefix, '').replace(dirty[1], `console.error("${sn.log}");`);
    }
    return prev;
  }, fnString);
};

const getFnMetadata = (fnString) => {
  const fnMetadata = fnRegex.exec(fnString) || fnEcmaRegex.exec(fnString);
  if (fnMetadata?.length >= 3) {
    const fn = fnMetadata[2].split(' ');
    return fn[0] === 'return' ? fnMetadata[2] : `return ${fnMetadata[2]}`;
  }
  return false;
};

// convert fn string to array
const fnToArray = (fnString) => {
  const regex = /\#\d+|[(),?;&.'":()+\-*/.]|<=|<|>|>=|!=|==|[||]{2}|=>|\w+| /g;
  return fnString.match(regex);
};

const handeNumericValue = (val) => {
  const regex = /^"\d+"$|^\d+$/;
  const isNumeric = regex.test(val);
  if (isNumeric) {
    return String(val).trim().replace(/['"]/g, '');
  }
  return val;
};

const generateFnBody = (fnMetadata, values) => {
  if (!fnMetadata) {
    return false;
  }

  const fnMetadataTemp = fnToArray(fnMetadata);

  // save defined condition to detect how many condition on fn
  // or save the total of condition inside fn string
  const fnBodyTemp = [];

  // generate the fnBody
  const fnBody = fnMetadataTemp.map((f) => {
    const meta = f.match(/#([0-9]*)/);
    if (meta) {
      fnBodyTemp.push(f); // save condition
      let val = values?.[meta[1]];
      if (!val) {
        return null;
      }
      if (typeof val === 'object') {
        if (Array.isArray(val)) {
          val = val.join(',');
        } else {
          if (val?.lat) {
            val = `${val.lat},${val.lng}`;
          } else {
            val = null;
          }
        }
      }
      if (typeof val === 'number') {
        val = Number(val);
      }
      if (typeof val === 'string') {
        val = `"${val}"`;
      }
      const fnMatch = f.match(/#([0-9]*|[0-9]*\..+)+/);
      if (fnMatch) {
        val = fnMatch[1] === meta[1] ? val : val + fnMatch[1];
      }
      return val;
    }
    return f;
  });

  // all fn conditions meet, return generated fnBody
  if (!fnBody.filter((x) => !x).length) {
    return fnBody.map(handeNumericValue).join('');
  }

  // return false if generated fnBody contains null align with fnBodyTemp
  // or meet the total of condition inside fn string
  if (fnBody.filter((x) => !x).length === fnBodyTemp.length) {
    return false;
  }

  // remap fnBody if only one fnBody meet the requirements
  return fnBody
    .filter((x) => x)
    .map(handeNumericValue)
    .join('');
};

const fixIncompleteMathOperation = (expression) => {
  // Regular expression to match incomplete math operations
  const incompleteMathRegex = /[+\-*/]\s*$/;

  // Check if the input ends with an incomplete math operation
  if (incompleteMathRegex.test(expression)) {
    // Add a default number (0 in this case) to complete the operation
    const mathExpression = expression?.slice(6)?.trim();
    if (mathExpression?.endsWith('+') || mathExpression?.endsWith('-')) {
      expression += '0';
    }
    if (['*', '/'].includes(mathExpression.slice(-1))) {
      return `return ${mathExpression.slice(0, -1)}`;
    }
  }
  return expression;
};

const strToFunction = (fnString, values) => {
  fnString = checkDirty(fnString);
  const fnMetadata = getFnMetadata(fnString);
  const fnBody = fixIncompleteMathOperation(generateFnBody(fnMetadata, values));
  try {
    return new Function(fnBody);
  } catch (error) {
    return false;
  }
};

const TypeAutofield = ({ onChange, keyform, id, name, tooltip, fn, displayOnly }) => {
  const [value, setValue] = useState(null);
  const [fieldColor, setFieldColor] = useState(null);
  const { fnString, fnColor } = fn;
  const values = FormState.useState((s) => s.currentValues);
  const automateValue = strToFunction(fnString, values);

  useEffect(() => {
    try {
      if (automateValue) {
        const _automateValue = automateValue();
        if (fnColor?.[_automateValue]) {
          setFieldColor(fnColor[_automateValue]);
        }
        setValue(_automateValue);
        if (!displayOnly && _automateValue) {
          FormState.update((s) => {
            s.currentValues[id] = _automateValue;
          });
        }
      } else {
        setValue(null);
        if (!displayOnly) {
          FormState.update((s) => {
            s.currentValues[id] = null;
          });
        }
      }
    } catch {
      setValue(null);
    }
  }, [automateValue, fnString, fnColor, displayOnly]);

  return (
    <View testID="type-autofield-wrapper">
      <FieldLabel keyform={keyform} name={name} tooltip={tooltip} />
      <Input
        inputContainerStyle={{
          ...styles.autoFieldContainer,
          backgroundColor: fieldColor || styles.autoFieldContainer.backgroundColor,
        }}
        value={value ? (value === NaN ? null : value.toString()) : null}
        testID="type-autofield"
        multiline={true}
        numberOfLines={2}
        disabled
        style={{
          fontWeight: 'bold',
          opacity: 1,
        }}
      />
    </View>
  );
};

export default TypeAutofield;
