import { ApiError, configureClient, request } from '../client';

jest.mock('expo-constants', () => ({ expoConfig: { extra: { apiUrl: 'https://api.test' } } }));

function mockFetch(status: number, body: unknown) {
  const fn = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe('request', () => {
  beforeEach(() => configureClient({ getToken: () => null, onUnauthorized: () => {} }));

  it('returns data from a successful response and builds the query string', async () => {
    const fetchMock = mockFetch(200, { success: true, data: { total: 1 } });
    const data = await request<{ total: number }>('/api/opportunities', { query: { search: 'shoes', sport: '' } });
    expect(data).toEqual({ total: 1 });
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/api/opportunities?search=shoes');
  });

  it('sends the bearer token when signed in', async () => {
    configureClient({ getToken: () => 'abc', onUnauthorized: () => {} });
    const fetchMock = mockFetch(200, { success: true, data: {} });
    await request('/api/auth/me');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer abc');
  });

  it('throws ApiError with the server message', async () => {
    mockFetch(409, { success: false, error: 'Already applied.' });
    await expect(request('/api/applications', { method: 'POST', body: {} })).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'Already applied.',
    });
  });

  it('uses the first validation message when there is no error string', async () => {
    mockFetch(400, { success: false, errors: [{ field: 'email', message: 'Valid email required' }] });
    await expect(request('/api/auth/login')).rejects.toThrow('Valid email required');
  });

  it('signs out on 401 when a token was sent', async () => {
    const onUnauthorized = jest.fn();
    configureClient({ getToken: () => 'expired', onUnauthorized });
    mockFetch(401, { success: false, error: 'Invalid token' });
    await expect(request('/api/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('reports network failures in plain English', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;
    await expect(request('/api/content')).rejects.toMatchObject({ status: 0 });
  });
});
