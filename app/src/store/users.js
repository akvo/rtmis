import { Store } from 'pullstate';

const UserState = new Store({
  id: null,
  name: '',
  password: '',
  token: null,
  syncWifiOnly: false,
  // syncInterval: 300,
  forms: [],
  currentLocation: null,
  locationIsGranted: false,
  syncDatapointsAdded: false,
  syncDatapointsForm: null,
});

export default UserState;
