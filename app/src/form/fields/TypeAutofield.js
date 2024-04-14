import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Input } from '@rneui/themed';
import PropTypes from 'prop-types';

import { FieldLabel } from '../support';
import styles from '../styles';
import { FormState } from '../../store';

const sanitize = [
  {
    prefix: /return fetch|fetch/g,
    re: /return fetch(\(.+)\} +|fetch(\(.+)\} +/,
    log: 'Fetch is not allowed.',
  },
];

const checkDirty = (fnString) =>
  sanitize.reduce((prev, sn) => {
    const dirty = prev.match(sn.re);
    if (dirty) {
      return prev.replace(sn.prefix, '').replace(dirty[1], `console.error("${sn.log}");`);
    }
    return prev;
  }, fnString);

// convert fn string to array
const fnToArray = (fnString) => {
  // eslint-disable-next-line no-useless-escape
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
        } else if (val?.lat) {
          val = `${val.lat},${val.lng}`;
        } else {
          val = null;
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
    return fnBody
      .map(handeNumericValue)
      .join('')
      .replace(/(?:^|\s)\.includes\(['"][^'"]+['"]\)/g, "''$1")
      .replace(/''\s*\./g, "''.");
  }

  // return false if generated fnBody contains null align with fnBodyTemp
  // or meet the total of condition inside fn string
  // if (fnBody.filter((x) => !x).length === fnBodyTemp.length) {
  //   return false;
  // }

  // remap fnBody if only one fnBody meet the requirements
  return fnBody
    .filter((x) => x)
    .map(handeNumericValue)
    .join('')
    .replace(/(?:^|\s)\.includes\(['"][^'"]+['"]\)/g, " ''$&")
    .replace(/''\s*\./g, "''.");
};

const fixIncompleteMathOperation = (expression) => {
  // Regular expression to match incomplete math operations
  const incompleteMathRegex = /[+\-*/]\s*$/;

  // Check if the input ends with an incomplete math operation
  if (incompleteMathRegex.test(expression)) {
    // If the expression ends with '+' or '-', append '0' to complete the operation
    if (expression.trim().endsWith('+') || expression.trim().endsWith('-')) {
      return `${expression.trim()}0`;
    }
    // If the expression ends with '*' or '/', it's safer to remove the operator
    if (expression.trim().endsWith('*') || expression.trim().endsWith('/')) {
      return expression.trim().slice(0, -1);
    }
  }
  return expression;
};

const strToFunction = (id, fnString, values) => {
  const fnStr = checkDirty(fnString);
  const fnBody = fixIncompleteMathOperation(generateFnBody(fnStr, values));
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return ${fnBody}`);
  } catch (error) {
    return false;
  }
};

const TypeAutofield = ({
  keyform,
  id,
  label,
  tooltip,
  fn,
  displayOnly,
  questions,
  value: autofieldValue,
}) => {
  const [value, setValue] = useState(null);
  const [fieldColor, setFieldColor] = useState(null);
  const { fnString: nameFnString, fnColor } = fn;

  const fnString = useMemo(() => {
    const allQuestions = questions.flatMap((q) => q.question);
    return nameFnString.replace(/#([a-zA-Z0-9_]+)+#/g, (match, token) => {
      const foundQuestion = allQuestions.find((q) => q.name === token);
      if (foundQuestion) {
        return `#${foundQuestion.id}`;
      }
      return `'${match}'`;
    });
  }, [nameFnString, questions]);

  useEffect(() => {
    const unsubsValues = FormState.subscribe(({ currentValues }) => {
      const automateValue = strToFunction(id, fnString, currentValues);
      if (typeof automateValue === 'function') {
        const answer = automateValue();
        if (answer !== value && (answer || answer === 0)) {
          setValue(answer);
          if (fnColor?.[answer]) {
            setFieldColor(fnColor[answer]);
          }
        }
      }
    });

    return () => {
      unsubsValues();
    };
  }, [fnColor, fnString, id, value]);

  useEffect(() => {
    if (value !== null && value !== autofieldValue && !displayOnly) {
      FormState.update((s) => {
        s.currentValues[id] = value;
      });
    }
  }, [value, id, autofieldValue, displayOnly]);

  return (
    <View testID="type-autofield-wrapper">
      <FieldLabel keyform={keyform} name={label} tooltip={tooltip} />
      <Input
        inputContainerStyle={{
          ...styles.autoFieldContainer,
          backgroundColor: fieldColor || styles.autoFieldContainer.backgroundColor,
        }}
        value={value || value === 0 ? String(value) : null}
        testID="type-autofield"
        multiline
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

TypeAutofield.propTypes = {
  keyform: PropTypes.number.isRequired,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.object,
  fn: PropTypes.shape({
    fnString: PropTypes.string,
    fnColor: PropTypes.object,
  }).isRequired,
  displayOnly: PropTypes.bool,
  questions: PropTypes.array,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

TypeAutofield.defaultProps = {
  displayOnly: false,
  questions: [],
  tooltip: null,
  value: null,
};
