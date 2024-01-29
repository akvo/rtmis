import React from 'react';
import { View } from 'react-native';
import { FieldLabel, OptionItem } from '../support';
import { styles } from '../styles';
import { Dropdown } from 'react-native-element-dropdown';
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

  const selectedStyle = React.useMemo(() => {
    const currentValue = value?.[0];
    const color = option.find((x) => x.name === currentValue)?.color;
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
      backgroundColor: color,
    };
  }, [value, id, option]);

  return (
    <View style={styles.optionContainer}>
      <FieldLabel keyform={keyform} name={name} tooltip={tooltip} requiredSign={requiredValue} />
      <Dropdown
        style={[styles.dropdownField]}
        selectedTextStyle={selectedStyle}
        data={option}
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
