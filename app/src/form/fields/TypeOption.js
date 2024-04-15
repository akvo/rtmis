import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import PropTypes from 'prop-types';
import { FieldLabel, OptionItem } from '../support';
import styles from '../styles';
import { FormState } from '../../store';
import { i18n } from '../../lib';

const TypeOption = ({
  onChange,
  value,
  keyform,
  id,
  label,
  option,
  tooltip,
  required,
  requiredSign,
  disabled,
}) => {
  const showSearch = useMemo(() => option.length > 3, [option]);
  const activeLang = FormState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const requiredValue = required ? requiredSign : null;
  const color = useMemo(() => {
    const currentValue = value?.[0];
    return option.find((x) => x.value === currentValue)?.color;
  }, [value, option]);

  const selectedStyle = useMemo(() => {
    const currentValue = value?.[0];
    const backgroundColor = option.find((x) => x.value === currentValue)?.color;
    if (!color) {
      return {};
    }
    return {
      marginLeft: -8,
      marginRight: -27,
      borderRadius: 5,
      paddingTop: 8,
      paddingLeft: 8,
      paddingBottom: 8,
      color: '#FFF',
      backgroundColor,
    };
  }, [value, color, option]);

  return (
    <View style={styles.optionContainer}>
      <FieldLabel keyform={keyform} name={label} tooltip={tooltip} requiredSign={requiredValue} />
      <Dropdown
        style={styles.dropdownField}
        selectedTextStyle={selectedStyle}
        data={option}
        search={showSearch}
        maxHeight={300}
        labelField="label"
        valueField="value"
        searchPlaceholder={trans.searchPlaceholder}
        value={value?.[0] || ''}
        onChange={({ value: optValue }) => {
          if (onChange) {
            onChange(id, [optValue]);
          }
        }}
        renderItem={OptionItem}
        testID="type-option-dropdown"
        placeholder={trans.selectItem}
        disable={disabled}
      />
    </View>
  );
};

export default TypeOption;

TypeOption.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.array,
  keyform: PropTypes.number.isRequired,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.object,
  required: PropTypes.bool.isRequired,
  requiredSign: PropTypes.string,
  disabled: PropTypes.bool,
  option: PropTypes.array,
};

TypeOption.defaultProps = {
  value: null,
  requiredSign: '*',
  disabled: false,
  option: [],
  tooltip: null,
};
