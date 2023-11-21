export const tables = [
  {
    name: 'users',
    fields: {
      id: 'INTEGER PRIMARY KEY NOT NULL',
      name: 'TEXT',
      password: 'TEXT',
      active: 'TINYINT',
    },
  },
  {
    name: 'config',
    fields: {
      id: 'INTEGER PRIMARY KEY NOT NULL',
      appVersion: 'VARCHAR(255) NOT NULL',
      authenticationCode: 'TEXT',
      serverURL: 'TEXT',
      syncInterval: 'REAL',
      syncWifiOnly: 'TINYINT',
      lang: 'VARCHAR(255) DEFAULT "en" NOT NULL',
    },
  },
  {
    name: 'forms',
    fields: {
      id: 'INTEGER PRIMARY KEY NOT NULL',
      formId: 'INTEGER NOT NULL',
      version: 'VARCHAR(255)',
      latest: 'TINYINT',
      name: 'VARCHAR(255)',
      json: 'TEXT',
      createdAt: 'DATETIME',
    },
  },
  {
    name: 'datapoints',
    fields: {
      id: 'INTEGER PRIMARY KEY NOT NULL',
      form: 'INTEGER NOT NULL',
      user: 'INTEGER NOT NULL',
      name: 'VARCHAR(255)',
      geo: 'VARCHAR(255)',
      submitted: 'TINYINT',
      duration: 'REAL',
      createdAt: 'DATETIME',
      submittedAt: 'DATETIME',
      syncedAt: 'DATETIME',
      json: 'TEXT',
    },
  },
  {
    name: 'sessions',
    fields: {
      id: 'INTEGER PRIMARY KEY NOT NULL',
      token: 'TEXT',
      passcode: 'TEXT',
    },
  },
];
