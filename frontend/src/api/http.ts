import { API_BASE_URL } from './config';

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export async function getJson<T>(path: string, params?: Record<string, string>) {
  const url = new URL(API_BASE_URL + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export async function postJson<T>(path: string, body: Json) {
  const res = await fetch(API_BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

