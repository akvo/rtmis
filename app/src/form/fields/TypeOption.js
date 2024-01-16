import React from 'react';
import { View } from 'react-native';
import { FieldLabel } from '../support';
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
  const selectedStyle = React.useMemo(() => {
    const currentValue = value?.[0];
    const color = option.find((x) => x.name === currentValue)?.color;
    if (color) {
      return {
        marginLeft: -10,
        marginRight: -30,
        marginTop: -5,
        marginBottom: -5,
        borderRadius: 5,
        paddingTop: 10,
        paddingLeft: 10,
        paddingBottom: 10,
        fontWeight: 'bold',
        color: '#FFF',
        backgroundColor: color,
      };
    }
    return {};
  }, [value, id, option]);

  return (
    <View style={styles.optionContainer}>
      <FieldLabel keyform={keyform} name={name} tooltip={tooltip} requiredSign={requiredValue} />
      <Dropdown
        style={[styles.dropdownField]}
        data={option}
        selectedTextStyle={selectedStyle}
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
        renderItem={(item) => {
          return (
            <View style={[{ backgroundColor: item?.color || '#FFF', padding: 15 }]}>
              <Text
                style={[
                  {
                    color: item?.color ? '#FFF' : '#000',
                    fontWeight: item?.color ? 'bold' : 'normal',
                  },
                ]}
              >
                {item?.label || item?.name}
              </Text>
            </View>
          );
        }}
        testID="type-option-dropdown"
        placeholder={trans.selectItem}
      />
    </View>
  );
};

export default TypeOption;
