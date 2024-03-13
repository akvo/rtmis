import React, { useState } from 'react';
import { View } from 'react-native';
import { Text, Icon } from '@rneui/themed';
import PropTypes from 'prop-types';
import styles from '../styles';
import AnimatedTooltip from '../../components/AnimatedTooltip';

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
        <View style={{ flexDirection: 'row' }}>
          <Text testID="field-label">
            {labelText}
            {tooltipText && (
              <Text>
                {' '}
                <Icon
                  name="information-circle"
                  type="ionicon"
                  size={18}
                  testID="field-tooltip-icon"
                  onPress={() => setOpen(!open)}
                />
              </Text>
            )}
          </Text>
        </View>
        <AnimatedTooltip visible={open} content={tooltipText} style={{ width: '100%' }} />
      </View>
    </View>
  );
};

export default FieldLabel;

FieldLabel.propTypes = {
  keyform: PropTypes.number,
  name: PropTypes.string.isRequired,
  tooltip: PropTypes.objectOf(PropTypes.shape({ text: PropTypes.string })),
  requiredSign: PropTypes.string,
};

FieldLabel.defaultProps = {
  keyform: 0,
  tooltip: null,
  requiredSign: null,
};
