import React, { useState } from 'react';
import { View } from 'react-native';
import { Field } from 'formik';
import moment from 'moment';
import { FieldLabel } from '../support';
import { styles } from '../styles';
import { Input } from '@rneui/themed';
import DateTimePicker from '@react-native-community/datetimepicker';

const TypeDate = ({ onChange, value, keyform, id, name, tooltip, required, requiredSign }) => {
  const [showDatepicker, setShowDatePicker] = useState(false);

  const getDate = (value) => {
    return typeof value === 'string' ? moment(value, 'YYYY-MM-DD').toDate() : value || new Date();
  };

  const datePickerValue = getDate(value);
  const requiredValue = required ? requiredSign : null;
  return (
    <View>
      <FieldLabel keyform={keyform} name={name} tooltip={tooltip} requiredSign={requiredValue} />
      <Field name={id}>
        {({ field, meta }) => {
          const dateValue = field?.value ? moment(field?.value).format('YYYY-MM-DD') : field?.value;
          const fieldProps = { ...field, value: dateValue };
          return (
            <Input
              inputContainerStyle={styles.inputFieldContainer}
              onPressIn={() => setShowDatePicker(true)}
              showSoftInputOnFocus={false}
              testID="type-date"
              errorMessage={meta.touched && meta.error ? meta.error : ''}
              {...fieldProps}
            />
          );
        }}
      </Field>
      {showDatepicker && (
        <DateTimePicker
          testID="date-time-picker"
          value={datePickerValue}
          mode="date"
          onChange={({ nativeEvent: val }) => {
            setShowDatePicker(false);
            if (onChange) {
              onChange(id, new Date(val.timestamp));
            }
          }}
        />
      )}
    </View>
  );
};

export default TypeDate;
