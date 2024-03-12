const mockDigestStringAsync = jest.fn();

export const Crypto = {
  CryptoDigestAlgorithm: {
    SHA1: 'SHA1',
  },
  digestStringAsync: mockDigestStringAsync,
};

export const digestStringAsync = (algorithm, data) => {
  return Promise.resolve(`Mocked${data}-${algorithm}`);
};

export const CryptoDigestAlgorithm = Crypto.CryptoDigestAlgorithm;
