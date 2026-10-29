import Constants from 'expo-constants';
import type { ApiFailure, ApiSuccess } from './types';

/** Thrown for any non-2xx response, with the server's message when it sent one. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: { field: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const DEFAULT_API_URL = 'https://plxyground.vercel.app';

export function apiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  const fromConfig = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  return (fromEnv || fromConfig || DEFAULT_API_URL).replace(/\/$/, '');
}

type TokenGetter = () => string | null;
let getToken: TokenGetter = () => null;
let onUnauthorized: () => void = () => {};

/** Wired up once by the auth store so every request carries the current token. */
export function configureClient(options: { getToken: TokenGetter; onUnauthorized: () => void }) {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${apiBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch {
    throw new ApiError('Could not reach PLXYGROUND. Check your connection and try again.', 0);
  }

  let payload: (ApiSuccess<T> & Record<string, unknown>) | ApiFailure | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.success === false) {
    if (response.status === 401 && token) onUnauthorized();
    const failure = (payload ?? {}) as ApiFailure;
    const message =
      failure.error ?? failure.errors?.[0]?.message ?? `Request failed (${response.status})`;
    throw new ApiError(message, response.status, failure.errors ?? []);
  }

  return payload.data;
}
