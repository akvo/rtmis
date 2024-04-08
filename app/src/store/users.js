import { Store } from 'pullstate';

const UserState = new Store({
  id: null,
  name: '',
  password: '',
  token: null,
  syncWifiOnly: false,
  // syncInterval: 300,
  forms: [],
  certifications: [],
  currentLocation: null,
  locationIsGranted: false,
});

export default UserState;
