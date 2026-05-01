const LOCAL_API_BASE_URL = 'http://localhost:3011';
const REQUEST_TIMEOUT_MS = 12000;

function trimTrailingSlash(value) {
  return value ? value.replace(/\/+$/, '') : value;
}

function getBaseUrl() {
  const configuredBaseUrl = trimTrailingSlash(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (typeof window !== 'undefined' && window.location?.origin) {
    const { hostname, origin } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocalHost) {
      // Prefer same-origin API proxy for deployed web builds so Vercel env drift
      // cannot strand the frontend on an old backend hostname.
      return trimTrailingSlash(origin);
    }
  }

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return LOCAL_API_BASE_URL;
}

function getApiUnavailableMessage(path) {
  if (!path.startsWith('/api/')) {
    return 'The request could not be completed right now. Please try again.';
  }

  return 'The API is not reachable right now. If this frontend is deployed on Vercel, set BACKEND_URL for the project and redeploy.';
}

export async function apiRequest(path, method = 'GET', body = null, token = null) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const options = { method, headers, signal: controller.signal };
    if (body) options.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(`${getBaseUrl()}${path}`, options);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw { status: 0, error: 'The request timed out. Please try again.' };
      }

      throw { status: 0, error: getApiUnavailableMessage(path) };
    }

    const raw = await res.text();
    let data = {};

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: raw };
      }
    }

    if (!res.ok) {
      throw {
        status: res.status,
        ...data,
        error:
          data.error ||
          data.message ||
          (res.status === 404 ? getApiUnavailableMessage(path) : 'The request could not be completed right now.'),
      };
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}
