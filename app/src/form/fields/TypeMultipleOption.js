import React from 'react';
import { View } from 'react-native';
import { FieldLabel, OptionItem } from '../support';
import { styles } from '../styles';
import { MultiSelect } from 'react-native-element-dropdown';
import { FormState } from '../../store';
import { Text } from 'react-native';
import { i18n } from '../../lib';

const TypeMultipleOption = ({
  onChange,
  value,
  keyform,
  id,
  label,
  option = [],
  tooltip,
  required,
  requiredSign,
  disabled,
}) => {
  const showSearch = React.useMemo(() => {
    return option.length > 3;
  }, [option]);
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
        onChange={(value) => {
          if (onChange) {
            onChange(id, value);
          }
        }}
        renderItem={OptionItem}
        renderSelectedItem={({ color, label, name }) => {
          const renderStyle = color ? { backgroundColor: color, fontWeight: 'bold' } : {};
          return (
            <View style={{ ...styles.optionSelectedList, ...renderStyle }}>
              <Text style={{ color: color ? '#fff' : '#000' }}>{label || name}</Text>
            </View>
          );
        }}
        testID="type-multiple-option-dropdown"
        confirmUnSelectItem={true}
        disable={disabled}
      />
    </View>
  );
};

export default TypeMultipleOption;
