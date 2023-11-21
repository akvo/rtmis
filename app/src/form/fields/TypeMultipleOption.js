import React from 'react';
import { View } from 'react-native';
import { FieldLabel } from '../support';
import { styles } from '../styles';
import { CheckBox } from '@rneui/themed';
import { MultiSelect } from 'react-native-element-dropdown';
import { FormState } from '../../store';
import { i18n } from '../../lib';

const TypeMultipleOption = ({
  onChange,
  values,
  keyform,
  id,
  name,
  option = [],
  tooltip,
  required,
  requiredSign,
}) => {
  const isCheckBox = React.useMemo(() => {
    return option.length <= 3;
  }, [option]);
  const activeLang = FormState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const requiredValue = required ? requiredSign : null;

  return (
    <View style={styles.multipleOptionContainer}>
      <FieldLabel keyform={keyform} name={name} tooltip={tooltip} requiredSign={requiredValue} />
      {isCheckBox ? (
        option.map((opt, opti) => (
          <CheckBox
            key={opti}
            containerStyle={styles.radioFieldContainer}
            textStyle={styles.radioFieldText}
            checked={values?.[id]?.includes(opt.name)}
            onPress={() => {
              if (onChange) {
                values?.[id]?.includes(opt.name)
                  ? onChange(`${id}.${opti}`, null)
                  : onChange(`${id}.${opti}`, opt.name);
              }
            }}
            title={opt.label}
          />
        ))
      ) : (
        <MultiSelect
          style={[styles.dropdownField]}
          selectedStyle={styles.dropdownSelectedList}
          data={option}
          search
          maxHeight={300}
          labelField="label"
          valueField="name"
          searchPlaceholder={trans.searchPlaceholder}
          placeholder={trans.selectMultiItem}
          value={values?.[id] || []}
          onChange={(value) => {
            if (onChange) {
              onChange(id, value);
            }
          }}
          testID="type-multiple-option-dropdown"
        />
      )}
    </View>
  );
};

export default TypeMultipleOption;
