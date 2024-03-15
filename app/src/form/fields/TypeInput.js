/* eslint-disable react/jsx-props-no-spreading */
import React, { isValidElement } from 'react';
import { View } from 'react-native';
import { Input, Text } from '@rneui/themed';
import PropTypes from 'prop-types';
import { FieldLabel } from '../support';
import styles from '../styles';

export const addPreffix = (addonBefore) => {
  if (!addonBefore) {
    return {};
  }
  const testID = 'field-preffix';
  let element = addonBefore;
  if (element && isValidElement(element)) {
    element = <View testID={testID}>{element}</View>;
  }
  if (element && !isValidElement(element)) {
    element = <Text testID={testID}>{element}</Text>;
  }
  return {
    leftIcon: element,
    leftIconContainerStyle: {
      backgroundColor: '#F5F5F5',
      marginLeft: -10,
      marginRight: 8,
      marginVertical: 0,
      paddingLeft: 8,
      paddingRight: 8,
      borderWidth: 0,
      borderColor: 'transparent',
      borderTopLeftRadius: 5,
      borderBottomLeftRadius: 5,
      borderRightWidth: 0.5,
      borderRightColor: 'grey',
    },
  };
};

export const addSuffix = (addonAfter) => {
  if (!addonAfter) {
    return {};
  }
  const testID = 'field-suffix';
  let element = addonAfter;
  if (element && isValidElement(element)) {
    element = <View testID={testID}>{element}</View>;
  }
  if (element && !isValidElement(element)) {
    element = <Text testID={testID}>{element}</Text>;
  }
  return {
    rightIcon: element,
    rightIconContainerStyle: {
      backgroundColor: '#F5F5F5',
      marginRight: -9,
      marginLeft: 8,
      marginVertical: 0,
      paddingRight: 8,
      paddingLeft: 8,
      borderWidth: 0,
      borderColor: 'transparent',
      borderTopRightRadius: 5,
      borderBottomRightRadius: 5,
      borderLeftWidth: 0.5,
      borderLeftColor: 'grey',
    },
  };
};

const TypeInput = ({
  onChange,
  value,
  keyform,
  id,
  label,
  addonAfter,
  addonBefore,
  tooltip,
  required,
  requiredSign,
  meta_uuid: metaUUID,
  disabled,
}) => {
  const requiredValue = required ? requiredSign : null;
  return (
    <View>
      <FieldLabel keyform={keyform} name={label} tooltip={tooltip} requiredSign={requiredValue} />
      <Input
        inputContainerStyle={styles.inputFieldContainer}
        onChangeText={(val) => {
          if (onChange) {
            onChange(id, val);
          }
        }}
        value={value}
        testID="type-input"
        {...addPreffix(addonBefore)}
        {...addSuffix(addonAfter)}
        disabled={metaUUID || disabled}
      />
    </View>
  );
};

export default TypeInput;

TypeInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  keyform: PropTypes.number.isRequired,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.object,
  required: PropTypes.bool.isRequired,
  requiredSign: PropTypes.string,
  disabled: PropTypes.bool,
  addonAfter: PropTypes.node,
  addonBefore: PropTypes.node,
  meta_uuid: PropTypes.bool,
};

TypeInput.defaultProps = {
  value: '',
  disabled: false,
  meta_uuid: false,
  requiredSign: "*",
  addonAfter: null,
  addonBefore: null,
  tooltip: null,
};
