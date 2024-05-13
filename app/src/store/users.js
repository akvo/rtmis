import { Store } from 'pullstate';

const UserState = new Store({
  id: null,
  name: '',
  password: '',
  token: null,
  syncWifiOnly: 0,
  // syncInterval: 300,
  forms: [],
  certifications: [],
  currentLocation: null,
  locationIsGranted: false,
});

export default UserState;
