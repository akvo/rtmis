import React from 'react';
import { StyleSheet } from 'react-native';
import { Dialog } from '@rneui/themed';
import PropTypes from 'prop-types';
import { UIState } from '../../store';
import { i18n } from '../../lib';

const SaveDialogMenu = ({ visible, setVisible, handleOnSaveAndExit, handleOnExit }) => {
  const activeLang = UIState.useState((s) => s.lang);
  const trans = i18n.text(activeLang);

  return (
    <Dialog visible={visible} testID="save-dialog-menu" overlayStyle={styles.dialogMenuContainer}>
      <Dialog.Button
        type="solid"
        title={trans.buttonSaveNExit}
        testID="save-and-exit-button"
        onPress={() => {
          if (handleOnSaveAndExit) {
            handleOnSaveAndExit();
          }
        }}
      />
      <Dialog.Button
        type="outline"
        title={trans.buttonExitWoSaving}
        testID="exit-without-saving-button"
        buttonStyle={styles.buttonDanger}
        titleStyle={styles.textDanger}
        onPress={() => {
          if (handleOnExit) {
            handleOnExit();
          }
        }}
      />
      <Dialog.Button
        type="outline"
        title={trans.buttonCancel}
        testID="cancel-button"
        onPress={() => {
          setVisible(false);
        }}
      />
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialogMenuContainer: { flex: 0.2, flexDirection: 'column', justifyContent: 'space-around' },
  buttonDanger: {
    borderColor: '#D63D39',
  },
  textDanger: {
    color: '#D63D39',
  },
});

export default SaveDialogMenu;

SaveDialogMenu.propTypes = {
  visible: PropTypes.bool.isRequired,
  setVisible: PropTypes.func.isRequired,
  handleOnExit: PropTypes.func,
  handleOnSaveAndExit: PropTypes.func,
};

SaveDialogMenu.defaultProps = {
  handleOnExit: null,
  handleOnSaveAndExit: null,
};
