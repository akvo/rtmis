import React, { useState } from 'react';
import { View } from 'react-native';
import { Text, Tooltip, Icon } from '@rneui/themed';
import { styles } from '../styles';

const FieldLabel = ({ keyform = 0, name, tooltip, requiredSign = null }) => {
  const [open, setOpen] = useState(false);
  const labelText = `${keyform + 1}. ${name}`;
  const tooltipText = tooltip?.text;
  return (
    <View style={styles.fieldLabelContainer}>
      {requiredSign && (
        <Text style={styles.fieldRequiredIcon} testID="field-required-icon">
          {requiredSign}
        </Text>
      )}
      <View style={styles.fieldLabel}>
        <Text testID="field-label">{labelText}</Text>
        {tooltipText && (
          <Icon
            name="information-circle"
            type="ionicon"
            size={18}
            testID="field-tooltip-icon"
            onPress={() => setOpen(!open)}
          />
        )}
        <Tooltip
          visible={open}
          onClose={() => {
            setOpen(false);
          }}
          popover={<Text testID="field-tooltip-text">{tooltipText}</Text>}
          backgroundColor="#e5e5e5"
          testID="field-tooltip"
        />
      </View>
    </View>
  );
};

export default FieldLabel;
