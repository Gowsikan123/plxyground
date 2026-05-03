/**
 * ApiClient — fetch-based HTTP client.
 * Automatically attaches the Bearer token from authStore so callers
 * never need to pass it manually.
 *
 * Signature kept backward-compatible:
 *   apiRequest(path, options?)              — preferred
 *   apiRequest(path, method, body, token)   — legacy positional form still works
 */
import { useAuthStore } from '../store/authStore';

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
      return trimTrailingSlash(origin);
    }
  }
  if (configuredBaseUrl) return configuredBaseUrl;
  return LOCAL_API_BASE_URL;
}

function getApiUnavailableMessage(path) {
  if (!path.startsWith('/api/')) {
    return 'The request could not be completed right now. Please try again.';
  }
  return 'The API is not reachable right now. If this frontend is deployed on Vercel, set BACKEND_URL for the project and redeploy.';
}

/**
 * @param {string} path  - API path e.g. '/api/content'
 * @param {object|string} [optionsOrMethod] - Either an options object { method, body, headers }
 *                                            or a legacy method string ('GET'|'POST'|...)
 * @param {object|null}  [legacyBody]   - Legacy positional body (only when 2nd arg is a string)
 * @param {string|null}  [legacyToken]  - Legacy positional token (only when 2nd arg is a string)
 */
export async function apiRequest(path, optionsOrMethod = 'GET', legacyBody = null, legacyToken = null) {
  // Resolve options — support both call styles
  let method, body, extraHeaders;
  if (typeof optionsOrMethod === 'string') {
    // Legacy: apiRequest(path, 'POST', body, token)
    method       = optionsOrMethod;
    body         = legacyBody;
    extraHeaders = legacyToken ? { Authorization: `Bearer ${legacyToken}` } : {};
  } else {
    // Preferred: apiRequest(path, { method, body, headers })
    method       = optionsOrMethod.method || 'GET';
    body         = optionsOrMethod.body   || null;
    extraHeaders = optionsOrMethod.headers || {};
  }

  // Auto-attach token from store unless caller already supplied one
  if (!extraHeaders.Authorization) {
    const storeToken = useAuthStore.getState().token;
    if (storeToken) extraHeaders.Authorization = `Bearer ${storeToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = { 'Content-Type': 'application/json', ...extraHeaders };
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
      try { data = JSON.parse(raw); } catch { data = { error: raw }; }
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
