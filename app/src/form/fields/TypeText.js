import React from 'react';
import { View } from 'react-native';
import { FieldLabel } from '../support';
import { styles } from '../styles';
import { Input } from '@rneui/themed';

const TypeText = ({
  onChange,
  value,
  keyform,
  id,
  name,
  tooltip,
  required,
  requiredSign,
  meta_uuid,
}) => {
  const requiredValue = required ? requiredSign : null;
  return (
    <View>
      <FieldLabel keyform={keyform} name={name} tooltip={tooltip} requiredSign={requiredValue} />
      <Input
        inputContainerStyle={styles.inputFieldContainer}
        multiline={true}
        numberOfLines={1}
        onChangeText={(val) => {
          if (onChange) {
            onChange(id, val);
          }
        }}
        value={value}
        testID="type-text"
        disabled={meta_uuid}
      />
    </View>
  );
};

export default TypeText;
