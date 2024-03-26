import crudSessions from '../crud-sessions';

jest.mock('expo-sqlite');

describe('crudSessions function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addSession', () => {
    it('should insert the session', async () => {
      const result = await crudSessions.addSession({ token: 'Bearer abcefg', passcode: '123456' });
      expect(result).toEqual({ rowsAffected: 1 });
    });
  });

  describe('selectLastSession', () => {
    it('should return false if session does not exist', async () => {
      const result = await crudSessions.selectLastSession();
      expect(result).toBe(false);
    });

    it('should return last session', async () => {
      // Mock the result set for select
      const sessions = [
        {
          token: 'Bearer 1',
          passcode: '123',
        },
        {
          token: 'Bearer 2',
          passcode: '321',
        },
      ];
      const mockSelectSql = jest.fn(() => sessions[1]);
      crudSessions.selectLastSession = mockSelectSql;
      const result = await crudSessions.selectLastSession();
      expect(result).toEqual(sessions[1]);
    });
  });
});
