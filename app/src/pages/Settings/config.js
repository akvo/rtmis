import { accuracyLevels } from '../../lib/loc';

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
        name: 'dataSyncInterval',
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
        key: 'BuildParamsState.dataSyncInterval',
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
  {
    id: 2,
    name: 'Geolocation',
    translations: [
      {
        language: 'fr',
        name: 'Géolocalisation',
      },
    ],
    description: {
      name: 'GPS threshold, Accuracy Level, Geolocation timeout',
      translations: [
        {
          language: 'fr',
          name: "Seuil GPS, Niveau de précision, Délai d'expiration de géolocalisation",
        },
      ],
    },
    fields: [
      {
        id: 41,
        type: 'number',
        name: 'gpsThreshold',
        label: 'GPS threshold',
        description: {
          name: 'GPS threshold in meters',
          translations: [
            {
              language: 'fr',
              name: 'Seuil GPS en mètres',
            },
          ],
        },
        key: 'BuildParamsState.gpsThreshold',
        editable: true,
        translations: [
          {
            language: 'fr',
            name: 'Seuil GPS',
          },
        ],
      },
      {
        id: 42,
        type: 'dropdown',
        name: 'gpsAccuracyLevel',
        label: 'Accuracy level',
        description: {
          name: 'The level of location manager accuracy',
          translations: [
            {
              language: 'fr',
              name: 'Le niveau de précision du gestionnaire de localisation.',
            },
          ],
        },
        key: 'BuildParamsState.gpsAccuracyLevel',
        editable: true,
        translations: [
          {
            language: 'fr',
            name: 'Niveau de précision',
          },
        ],
        options: accuracyLevels,
      },
      {
        id: 43,
        type: 'number',
        name: 'geoLocationTimeout',
        label: 'Geolocation Timeout',
        description: {
          name: 'Timeout for taking points on geolocation questions in seconds',
          translations: [
            {
              language: 'fr',
              name: "Délai d'expiration pour prendre des points sur les questions de géolocalisation en secondes",
            },
          ],
        },
        key: 'BuildParamsState.geoLocationTimeout',
        editable: true,
        translations: [
          {
            language: 'fr',
            name: "Délai d'expiration de la géolocalisation",
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
