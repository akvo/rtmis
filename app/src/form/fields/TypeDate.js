import React, { useState } from 'react';
import { View } from 'react-native';
import { Field } from 'formik';
import moment from 'moment';
import { Input } from '@rneui/themed';
import DateTimePicker from '@react-native-community/datetimepicker';
import PropTypes from 'prop-types';
import { FieldLabel } from '../support';
import styles from '../styles';

const TypeDate = ({ onChange, value, keyform, id, label, tooltip, required, requiredSign }) => {
  const [showDatepicker, setShowDatePicker] = useState(false);

  const getDate = (v) =>
    typeof v === 'string' ? moment(v, 'YYYY-MM-DD').toDate() : v || new Date();

  const datePickerValue = getDate(value);
  const requiredValue = required ? requiredSign : null;
  return (
    <View>
      <FieldLabel keyform={keyform} name={label} tooltip={tooltip} requiredSign={requiredValue} />
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
              // eslint-disable-next-line react/jsx-props-no-spreading
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

TypeDate.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.arrayOf().isRequired,
  keyform: PropTypes.number.isRequired,
  id: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.string.isRequired,
  required: PropTypes.bool.isRequired,
  requiredSign: PropTypes.string,
  disabled: PropTypes.bool,
};

TypeDate.defaultProps = {
  requiredSign: null,
  disabled: false,
};
