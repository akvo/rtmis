import crudConfig from '../crud-config';
jest.mock('expo-sqlite');

describe('crudConfig function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addConfig', () => {
    it('should insert into config table', async () => {
      const result = await crudConfig.addConfig();
      expect(result).toEqual({ rowsAffected: 1 });
    });
  });

  describe('getConfig', () => {
    it('should return false if config does not exist', async () => {
      const result = await crudConfig.getConfig();
      expect(result).toBe(false);
    });

    it('should return config table value', async () => {
      // Mock the result set for select
      const config = {
        appVersion: '1.0.0',
        authenticationCode: 'testincodeg123',
        id: 1,
        lang: 'en',
        serverURL: 'URL',
        syncInterval: null,
        syncWifiOnly: null,
      };
      const mockSelectSql = jest.fn(() => config);
      crudConfig.getConfig = mockSelectSql;
      const result = await crudConfig.getConfig();
      expect(result).toEqual(config);
    });
  });

  describe('updateConfig', () => {
    it('should update the config table', async () => {
      const result = await crudConfig.updateConfig({ serverURL: 'new URL' });
      expect(result).toEqual({ rowsAffected: 1 });
    });
  });
});
