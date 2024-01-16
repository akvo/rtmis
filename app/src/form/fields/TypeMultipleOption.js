import React from 'react';
import { View } from 'react-native';
import { FieldLabel } from '../support';
import { styles } from '../styles';
import { MultiSelect } from 'react-native-element-dropdown';
import { FormState } from '../../store';
import { Text } from 'react-native';
import { Icon } from '@rneui/themed';
import { i18n } from '../../lib';

const TypeMultipleOption = ({
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

  return (
    <View style={styles.multipleOptionContainer}>
      <FieldLabel keyform={keyform} name={name} tooltip={tooltip} requiredSign={requiredValue} />
      <MultiSelect
        style={[styles.dropdownField]}
        selectedStyle={styles.dropdownSelectedList}
        data={option}
        search={showSearch}
        maxHeight={300}
        labelField="label"
        valueField="name"
        searchPlaceholder={trans.searchPlaceholder}
        placeholder={trans.selectMultiItem}
        value={value || []}
        onChange={(value) => {
          if (onChange) {
            onChange(id, value);
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
        renderSelectedItem={(item) => {
          return (
            <View
              style={[
                {
                  backgroundColor: item?.color || '#CCC',
                  padding: 10,
                  marginLeft: 10,
                  marginTop: 5,
                  borderRadius: 5,
                  borderWidth: 0,
                },
              ]}
            >
              <Text
                style={[
                  {
                    color: item?.color ? '#FFF' : '#000',
                    fontWeight: item?.color ? 'bold' : 'normal',
                    fontSize: 14,
                  },
                ]}
              >
                {item?.label || item?.name}
                {'  '} ✖
              </Text>
            </View>
          );
        }}
        testID="type-multiple-option-dropdown"
        confirmUnSelectItem={true}
      />
    </View>
  );
};

export default TypeMultipleOption;
