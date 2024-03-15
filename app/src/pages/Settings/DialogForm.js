import React, { useState } from 'react';
import { Dialog, Input, Slider, Text } from '@rneui/themed';
import { Dropdown } from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { UIState } from '../../store';
import { i18n } from '../../lib';

const DialogForm = ({ onOk, onCancel, showDialog, edit, initValue }) => {
  const [value, setValue] = useState(initValue);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  const { type, label, slider, value: defaultValue, options, description } = edit || {};
  const isPassword = type === 'password' || false;

  return (
    <Dialog isVisible={showDialog} testID="settings-form-dialog">
      {type === 'slider' && (
        <Slider
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...slider}
          allowTouchTrack
          onValueChange={setValue}
          trackStyle={{ height: 5, backgroundColor: '#2089dc' }}
          thumbStyle={{ height: 20, width: 20, backgroundColor: '#2089dc' }}
          thumbProps={{
            children: <Icon name="ellipse" size={20} color="#2089dc" />,
          }}
          testID="settings-form-slider"
        />
      )}
      {['text', 'number', 'password'].includes(type) && (
        <Input
          placeholder={label}
          secureTextEntry={isPassword}
          onChangeText={setValue}
          defaultValue={defaultValue?.toString()}
          testID="settings-form-input"
          keyboardType={type === 'number' ? 'number-pad' : 'default'}
        />
      )}
      {type === 'dropdown' && (
        <Dropdown
          data={options}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={label}
          value={value}
          onChange={(item) => {
            setValue(item.value);
          }}
          testID="settings-form-dropdown"
        />
      )}
      {description?.name && <Text>{i18n.transform(activeLang, description)?.name}</Text>}
      <Dialog.Actions>
        <Dialog.Button onPress={() => onOk(value)} testID="settings-form-dialog-ok">
          {trans.buttonOk}
        </Dialog.Button>
        <Dialog.Button onPress={onCancel} testID="settings-form-dialog-cancel">
          {trans.buttonCancel}
        </Dialog.Button>
      </Dialog.Actions>
    </Dialog>
  );
};

export default DialogForm;

DialogForm.propTypes = {
  onOk: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  showDialog: PropTypes.bool.isRequired,
  edit: PropTypes.object,
  initValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

DialogForm.defaultProps = {
  initValue: 0,
  edit: null,
};
