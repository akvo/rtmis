import axios from 'axios';
import api, { config } from '../api';

jest.mock('axios');

describe('API module', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should make a GET request with the correct URL and config', async () => {
    const url = '/users';
    const response = { data: { id: 1, name: 'John Doe' } };

    axios.mockResolvedValueOnce(response);
    const result = await api.get(url);

    expect(axios).toHaveBeenCalledWith({
      url: url,
      ...config,
    });
    expect(result.data).toEqual(response.data);
  });

  it('should make a POST request with the correct URL, data, and config', async () => {
    const url = '/users';
    const data = { name: 'John Doe', email: 'john@example.com' };
    const response = { data: { id: 1, ...data } };

    axios.mockResolvedValueOnce(response);
    const result = await api.post(url, data);

    expect(axios).toHaveBeenCalledWith({
      url: url,
      method: 'POST',
      data,
      ...config,
    });
    expect(result.data).toEqual(response.data);
  });

  it('should make a PUT request with the correct URL, data, and config', async () => {
    const url = '/users/1';
    const data = { name: 'John Doe', email: 'john@example.com' };
    const response = { data: { id: 1, ...data } };

    axios.mockResolvedValueOnce(response);
    const result = await api.put(url, data);

    expect(axios).toHaveBeenCalledWith({
      url: url,
      method: 'PUT',
      data,
      ...config,
    });
    expect(result.data).toEqual(response.data);
  });

  it('should make a PATCH request with the correct URL, data, and config', async () => {
    const url = '/users/1';
    const data = { name: 'John Doe', email: 'john@example.com' };
    const response = { data: { id: 1, ...data } };

    axios.mockResolvedValueOnce(response);
    const result = await api.patch(url, data);

    expect(axios).toHaveBeenCalledWith({
      url: url,
      method: 'PATCH',
      data,
      ...config,
    });
    expect(result.data).toEqual(response.data);
  });

  it('should make a DELETE request with the correct URL and config', async () => {
    const url = '/users/1';
    const response = { data: { success: true } };

    axios.mockResolvedValueOnce(response);
    const result = await api.delete(url);

    expect(axios).toHaveBeenCalledWith({
      url: url,
      method: 'DELETE',
      ...config,
    });
    expect(result.data).toEqual(response.data);
  });

  it('should set the token', () => {
    const token = 'my-token';
    api.setToken(token);
    expect(api.token).toEqual(token);
  });
});
