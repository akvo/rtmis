import React from 'react';
import { View } from 'react-native';
import { FieldLabel, OptionItem } from '../support';
import { styles } from '../styles';
import { Dropdown } from 'react-native-element-dropdown';
import { Text } from 'react-native';
import { FormState } from '../../store';
import { i18n } from '../../lib';

const TypeOption = ({
  onChange,
  value,
  keyform,
  id,
  name,
  option = [],
  tooltip,
  required,
  requiredSign,
}) => {
  const showSearch = React.useMemo(() => {
    return option.length > 3;
  }, [option]);
  const activeLang = FormState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const requiredValue = required ? requiredSign : null;
  const color = React.useMemo(() => {
    const currentValue = value?.[0];
    return option.find((x) => x.name === currentValue)?.color;
  }, [value, id, option]);

  return (
    <View style={styles.optionContainer}>
      <FieldLabel keyform={keyform} name={name} tooltip={tooltip} requiredSign={requiredValue} />
      <Dropdown
        style={[styles.dropdownField]}
        data={option}
        renderLeftIcon={() =>
          color ? (
            <View>
              <Text style={[{ color: color }]}>● </Text>
            </View>
          ) : null
        }
        search={showSearch}
        maxHeight={300}
        labelField="label"
        valueField="name"
        searchPlaceholder={trans.searchPlaceholder}
        value={value?.[0] || ''}
        onChange={({ name: optValue }) => {
          if (onChange) {
            onChange(id, [optValue]);
          }
        }}
        renderItem={OptionItem}
        testID="type-option-dropdown"
        placeholder={trans.selectItem}
      />
    </View>
  );
};

export default TypeOption;
