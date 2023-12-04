import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

import Navigation from './src/navigation';
import { conn, query, tables } from './src/database';
import { UIState, AuthState, UserState, BuildParamsState } from './src/store';
import { crudSessions, crudUsers, crudConfig } from './src/database/crud';
import { api } from './src/lib';
import { NetworkStatusBar } from './src/components';

const db = conn.init;

const App = () => {
  const serverURLState = BuildParamsState.useState((s) => s.serverURL);

  const handleCheckSession = () => {
    crudSessions.selectLastSession().then((session) => {
      if (!session) {
        return session;
      }
      console.info('Session =>', session);
      api.setToken(session.token);
      // check users exist
      crudUsers
        .getActiveUser()
        .then((user) => {
          console.info('Users =>', user);

          const page = 'Home';
          // session && user?.id ? 'Home' : 'AddUser';
          return { user, page };
        })
        .then(({ user, page }) => {
          UserState.update((s) => {
            s.id = user.id;
            s.name = user.name;
            s.password = user.password;
          });
          AuthState.update((s) => {
            s.token = session.token;
            s.authenticationCode = session.passcode;
          });
          UIState.update((s) => {
            s.currentPage = page;
          });
        });
    });
  };

  const handleInitConfig = async () => {
    const configExist = await crudConfig.getConfig();
    const serverURL = configExist?.serverURL || serverURLState;
    if (!configExist) {
      await crudConfig.addConfig({ serverURL });
    }
    if (serverURL) {
      BuildParamsState.update((s) => {
        s.serverURL = serverURL;
      });
      api.setServerURL(serverURL);
      await crudConfig.updateConfig({ serverURL });
    }
    console.info('[CONFIG] Server URL', serverURL);
  };

  React.useEffect(() => {
    const queries = tables.map((t) => {
      const queryString = query.initialQuery(t.name, t.fields);
      return conn.tx(db, queryString);
    });
    Promise.all(queries)
      .then(() => {
        handleInitConfig();
      })
      .then(() => {
        handleCheckSession();
      });
  }, []);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      UIState.update((s) => {
        s.online = state.isConnected;
        s.networkType = state.type;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <Navigation testID="navigation-element" />
      <NetworkStatusBar />
    </SafeAreaProvider>
  );
};

export default App;
