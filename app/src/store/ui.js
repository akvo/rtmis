import { Store } from 'pullstate';

const UIState = new Store({
  isDarkMode: false, // if isDarkMode = false then Theme= light
  lang: 'en',
  fontSize: 16,
  currentPage: 'GetStarted',
  online: false,
  networkType: null,
  isManualSynced: false,
  statusBar: null,
});

export default UIState;
