import React from 'react';
import { View } from 'react-native';
import { FieldLabel } from '../support';
import { styles } from '../styles';
import { CheckBox } from '@rneui/themed';
import { Dropdown } from 'react-native-element-dropdown';
import { FormState } from '../../store';
import { i18n } from '../../lib';

const TypeOption = ({
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
  const isRadioGroup = React.useMemo(() => {
    return option.length <= 3;
  }, [option]);
  const activeLang = FormState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);
  const requiredValue = required ? requiredSign : null;

  return (
    <View style={styles.optionContainer}>
      <FieldLabel keyform={keyform} name={name} tooltip={tooltip} requiredSign={requiredValue} />
      {isRadioGroup ? (
        option.map((opt, opti) => (
          <CheckBox
            key={opti}
            containerStyle={styles.radioFieldContainer}
            textStyle={styles.radioFieldText}
            checked={values?.[id]?.includes(opt.name)}
            onPress={() => {
              if (onChange) {
                onChange(id, [opt.name]);
              }
            }}
            title={opt.label}
            checkedIcon="dot-circle-o"
            uncheckedIcon="circle-o"
            testID={`type-option-radio-${opti}`}
          />
        ))
      ) : (
        <Dropdown
          style={[styles.dropdownField]}
          data={option}
          search
          maxHeight={300}
          labelField="label"
          valueField="name"
          searchPlaceholder={trans.searchPlaceholder}
          value={values?.[id]?.[0] || []}
          onChange={({ name: value }) => {
            if (onChange) {
              onChange(id, [value]);
            }
          }}
          testID="type-option-dropdown"
          placeholder={trans.selectItem}
        />
      )}
    </View>
  );
};

export default TypeOption;
