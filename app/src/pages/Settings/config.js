export const config = [
  {
    id: 1,
    name: 'Advanced',
    translations: [
      {
        language: 'fr',
        name: 'Avancée',
      },
    ],
    description: {
      name: 'Server URL, Auth Code, Sync Interval, Sync Wifi',
      translations: [
        {
          language: 'fr',
          name: "URL du serveur, code d'authentification, intervalle de synchronisation, synchronisation Wifi",
        },
      ],
    },
    fields: [
      {
        id: 11,
        type: 'text',
        label: 'Server URL',
        name: 'serverURL',
        description: null,
        key: 'BuildParamsState.serverURL',
        editable: false,
        translations: [
          {
            language: 'fr',
            name: 'URL du serveur',
          },
        ],
      },
      {
        id: 14,
        type: 'text',
        name: 'authenticationCode',
        label: 'Passcode',
        description: null,
        key: 'AuthState.authenticationCode',
        editable: false,
        translations: [
          {
            language: 'fr',
            name: "Code d'accès",
          },
        ],
      },
      {
        id: 31,
        type: 'number',
        name: 'syncInterval',
        label: 'Sync interval',
        description: {
          name: 'Sync interval in seconds',
          translations: [
            {
              language: 'fr',
              name: 'Intervalle de synchronisation en secondes',
            },
          ],
        },
        key: 'UserState.syncInterval',
        editable: true,
        translations: [
          {
            language: 'fr',
            name: 'Intervalle de synchronisation',
          },
        ],
      },
      {
        id: 32,
        type: 'switch',
        label: 'Sync Wifi',
        name: 'syncWifiOnly',
        description: {
          name: 'Sync Wifi only',
          translations: [
            {
              language: 'fr',
              name: 'Synchroniser le Wi-Fi uniquement',
            },
          ],
        },
        key: 'UserState.syncWifiOnly',
        editable: true,
        translations: [
          {
            language: 'fr',
            name: 'Synchroniser le Wi-Fi uniquement',
          },
        ],
      },
    ],
  },
];

export const langConfig = {
  type: 'dropdown',
  name: 'lang',
  label: 'Language',
  description: 'Application language',
  options: [
    {
      label: 'English',
      value: 'en',
    },
    {
      label: 'French',
      value: 'fr',
    },
  ],
};
