import React, { useState } from 'react';
import { Dialog, Input, Slider } from '@rneui/themed';
import { Dropdown } from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/Ionicons';
import { UIState } from '../../store';
import { i18n } from '../../lib';

const DialogForm = ({ onOk, onCancel, showDialog, edit, initValue = 0 }) => {
  const [value, setValue] = useState(initValue);
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  const { type, label, slider, value: defaultValue, options } = edit || {};
  const isPassword = type === 'password' || false;

  return (
    <Dialog isVisible={showDialog} testID="settings-form-dialog">
      {type === 'slider' && (
        <Slider
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
