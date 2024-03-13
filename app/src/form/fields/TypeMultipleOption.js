import React from 'react';
import { View, Text } from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';
import PropTypes from 'prop-types';
import { FieldLabel, OptionItem } from '../support';
import styles from '../styles';
import { FormState } from '../../store';
import { i18n } from '../../lib';

const TypeMultipleOption = ({
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
  const showSearch = React.useMemo(() => option.length > 3, [option]);
  const activeLang = FormState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const requiredValue = required ? requiredSign : null;

  return (
    <View style={styles.multipleOptionContainer}>
      <FieldLabel keyform={keyform} name={label} tooltip={tooltip} requiredSign={requiredValue} />
      <MultiSelect
        style={[styles.dropdownField]}
        selectedStyle={styles.dropdownSelectedList}
        activeColor="#ddd"
        data={option}
        search={showSearch}
        maxHeight={300}
        labelField="label"
        valueField="value"
        searchPlaceholder={trans.searchPlaceholder}
        placeholder={trans.selectMultiItem}
        value={value || []}
        onChange={(v) => {
          if (onChange) {
            onChange(id, v);
          }
        }}
        renderItem={OptionItem}
        renderSelectedItem={({ color, label: labelText, name }) => {
          const renderStyle = color ? { backgroundColor: color, fontWeight: 'bold' } : {};
          return (
            <View style={{ ...styles.optionSelectedList, ...renderStyle }}>
              <Text style={{ color: color ? '#fff' : '#000' }}>{labelText || name}</Text>
            </View>
          );
        }}
        testID="type-multiple-option-dropdown"
        confirmUnSelectItem
        disable={disabled}
      />
    </View>
  );
};

export default TypeMultipleOption;

TypeMultipleOption.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.arrayOf().isRequired,
  keyform: PropTypes.number.isRequired,
  id: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.string.isRequired,
  required: PropTypes.bool.isRequired,
  requiredSign: PropTypes.string,
  disabled: PropTypes.bool,
  option: PropTypes.arrayOf(),
};

TypeMultipleOption.defaultProps = {
  requiredSign: null,
  disabled: false,
  option: [],
};
