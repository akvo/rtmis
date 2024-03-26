import React, { useState } from 'react';
import { Button } from '@rneui/themed';
import { Menu, MenuItem, MenuDivider } from 'react-native-material-menu';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { langConfig } from '../../pages/Settings/config';
import DialogForm from '../../pages/Settings/DialogForm';
import { FormState, UIState } from '../../store';
import { i18n } from '../../lib';

const SaveDropdownMenu = ({ anchor, visible, setVisible, handleOnSaveAndExit, handleOnExit }) => {
  const [showLanguageSelectionDialog, setShowLanguageSelectionDialog] = useState(false);
  const activeLang = FormState.useState((s) => s.lang);
  const appLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(appLang);

  const handleOnOk = (value) => {
    FormState.update((s) => {
      s.lang = value;
    });
    setShowLanguageSelectionDialog(false);
  };

  return (
    <>
      <Menu
        animationDuration={0}
        visible={visible}
        anchor={
          anchor || (
            <Button
              testID="anchor-dropdown-menu"
              onPress={() => {
                if (setVisible) {
                  setVisible(true);
                }
              }}
            >
              {trans.buttonShowMenu}
            </Button>
          )
        }
        onRequestClose={() => {
          if (setVisible) {
            setVisible(false);
          }
        }}
        testID="save-dropdown-menu"
        style={styles.dropdownContainer}
      >
        <MenuItem
          onPress={() => {
            if (handleOnSaveAndExit) {
              handleOnSaveAndExit();
            }
          }}
          testID="save-and-exit-menu-item"
        >
          {trans.buttonSaveNExit}
        </MenuItem>
        <MenuItem
          onPress={() => {
            if (handleOnExit) {
              handleOnExit();
            }
          }}
          testID="exit-without-saving-menu-item"
        >
          {trans.buttonExitWoSaving}
        </MenuItem>
        <MenuDivider />
        {/* <MenuItem
          testID="language-selection-menu-item"
          onPress={() => {
            setShowLanguageSelectionDialog(true);
            setVisible(false);
          }}
        >
          {trans.langSelection}
        </MenuItem> */}
      </Menu>
      <DialogForm
        onOk={handleOnOk}
        onCancel={() => setShowLanguageSelectionDialog(false)}
        showDialog={showLanguageSelectionDialog}
        edit={langConfig}
        initValue={activeLang}
      />
    </>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    marginTop: 50,
  },
});

export default SaveDropdownMenu;

SaveDropdownMenu.propTypes = {
  anchor: PropTypes.node,
  visible: PropTypes.bool.isRequired,
  setVisible: PropTypes.func.isRequired,
  handleOnExit: PropTypes.func,
  handleOnSaveAndExit: PropTypes.func,
};

SaveDropdownMenu.defaultProps = {
  anchor: null,
  handleOnExit: null,
  handleOnSaveAndExit: null,
};
