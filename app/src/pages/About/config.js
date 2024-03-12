export const config = [
  {
    id: 1,
    name: 'About',
    fields: [
      {
        id: 1,
        type: 'text',
        label: 'About RTMIS',
        name: 'serverURL',
        description: 'Lorem Ipsum',
        editable: false,
        translations: [
          {
            language: 'fr',
            name: 'About RTMIS',
            description: 'Lorem Ipsum',
          },
        ],
      },
      {
        id: 2,
        type: 'version',
        name: 'appVersion',
        label: 'App Version',
        description: null,
        editable: false,
        key: 'BuildParamsState.appVersion',
        translations: [
          {
            language: 'fr',
            name: 'App Version',
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
