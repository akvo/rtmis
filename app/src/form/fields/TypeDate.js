import React, { useState } from 'react';
import { View } from 'react-native';
import moment from 'moment';
import { Input } from '@rneui/themed';
import DateTimePicker from '@react-native-community/datetimepicker';
import PropTypes from 'prop-types';
import { FieldLabel } from '../support';
import styles from '../styles';

const TypeDate = ({
  onChange,
  value,
  keyform,
  id,
  label,
  tooltip,
  required,
  requiredSign,
  disabled,
}) => {
  const [showDatepicker, setShowDatePicker] = useState(false);

  const getDate = (v) =>
    typeof v === 'string' ? moment(v, 'YYYY-MM-DD').toDate() : v || new Date();

  const datePickerValue = getDate(value);
  const requiredValue = required ? requiredSign : null;
  const dateValue = value ? moment(value).format('YYYY-MM-DD') : value;
  return (
    <View>
      <FieldLabel keyform={keyform} name={label} tooltip={tooltip} requiredSign={requiredValue} />
      <Input
        inputContainerStyle={styles.inputFieldContainer}
        onPressIn={() => setShowDatePicker(true)}
        showSoftInputOnFocus={false}
        testID="type-date"
        value={dateValue}
        disabled={disabled}
      />
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
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  keyform: PropTypes.number.isRequired,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.object,
  required: PropTypes.bool.isRequired,
  requiredSign: PropTypes.string,
  disabled: PropTypes.bool,
};

TypeDate.defaultProps = {
  value: null,
  requiredSign: "*",
  disabled: false,
  tooltip: null,
};
