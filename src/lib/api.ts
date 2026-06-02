const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const err = await res.json().catch(() => ({}));
    // Unwrap error from NestJS interceptor envelope { success, data, message }
    throw new Error(err?.message ?? err?.data?.message ?? `Request failed: ${res.status}`);
  }

  const json = await res.json();
  // NestJS ResponseInterceptor wraps every response as { success, data, message }.
  // Unwrap transparently so callers get the raw payload.
  return (json?.data !== undefined ? json.data : json) as T;
}

export const api = {
  get:    <T>(path: string)                  => apiFetch<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body: unknown)   => apiFetch<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)   => apiFetch<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)                  => apiFetch<T>(path, { method: 'DELETE' }),
};
