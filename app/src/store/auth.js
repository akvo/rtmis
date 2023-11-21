import { Store } from 'pullstate';
/**
 * Server config
 */
const AuthState = new Store({
  authenticationCode: '',
  useAuthenticationCode: false, // using code for authentication
  username: '',
  password: '',
  token: null,
});

export default AuthState;
