import useSWR, { mutate, SWRConfiguration } from 'swr'
import { Namespace, PagedItems, ContentItem, VersionHistory, Policies } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'

function authHeaders(userId?: string) {
  const headers: Record<string,string> = { 'Content-Type': 'application/json' }
  try {
    const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('access_token') : undefined
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (userId) headers['x-user-id'] = userId
  } catch {}
  return headers
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  if (res.status === 401 || res.status === 403) {
    // Consumers can handle redirect
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export function usePolicies(config?: SWRConfiguration) {
  return useSWR<Policies>(`${BASE_URL}/rbac/policies`, (u) => jsonFetch(u, { headers: authHeaders() }), config)
}

export function useNamespaces(config?: SWRConfiguration) {
  return useSWR<Namespace[]>(`${BASE_URL}/content/namespaces`, (u) => jsonFetch(u, { headers: authHeaders() }), config)
}

export function buildContentItemsKey(params: Record<string, any>): string {
  const query = new URLSearchParams(params as any).toString()
  return `${BASE_URL}/content/items?${query}`
}

export function useContentItems(params: Record<string, any>, config?: SWRConfiguration) {
  const key = buildContentItemsKey(params)
  return useSWR<PagedItems>(key, (u) => jsonFetch(u, { headers: authHeaders() }), { keepPreviousData: true, ...config })
}

export function useLabels(namespaceKey?: string, config?: SWRConfiguration) {
  const key = namespaceKey ? `${BASE_URL}/content/labels?namespace=${encodeURIComponent(namespaceKey)}` : null
  return useSWR<string[]>(key, (u) => jsonFetch(u, { headers: authHeaders() }), config)
}

export async function createContentItem(input: Partial<ContentItem>, userId: string) {
  return jsonFetch<ContentItem>(`${BASE_URL}/content/items`, {
    method: 'POST',
    headers: authHeaders(userId),
    body: JSON.stringify(input)
  })
}

export async function patchContentItem(id: string, input: Partial<ContentItem>, userId: string) {
  return jsonFetch<ContentItem>(`${BASE_URL}/content/items/${id}`, {
    method: 'PATCH',
    headers: authHeaders(userId),
    body: JSON.stringify(input)
  })
}

export async function updateContentItem(id: string, input: Partial<ContentItem>, userId: string) {
  return patchContentItem(id, input, userId)
}

export async function deleteContentItem(id: string, userId: string) {
  return fetch(`${BASE_URL}/content/items/${id}`, { method: 'DELETE', headers: authHeaders(userId), credentials: 'include' })
}

export async function publishContentItem(id: string, userId: string) {
  return patchContentItem(id, { status: 'published' }, userId)
}

export async function archiveContentItem(id: string, userId: string) {
  return patchContentItem(id, { status: 'archived' }, userId)
}

export async function restoreContentItem(id: string, version: number, userId: string) {
  return jsonFetch<ContentItem>(`${BASE_URL}/content/items/${id}/versions/${version}/restore`, {
    method: 'POST',
    headers: authHeaders(userId)
  })
}

export function useVersions(id?: string, config?: SWRConfiguration) {
  const key = id ? `${BASE_URL}/content/items/${id}/versions` : null
  return useSWR<VersionHistory[]>(key, (u) => jsonFetch(u, { headers: authHeaders() }), config)
}

export function useContentItem(id?: string, config?: SWRConfiguration) {
  const key = id ? `${BASE_URL}/content/items/${id}` : null
  return useSWR<ContentItem>(key, (u) => jsonFetch(u, { headers: authHeaders() }), config)
}

// Namespace mutations (admin only)
export async function createNamespace(input: Partial<Namespace>, userId: string) {
  const result = await jsonFetch<Namespace>(`${BASE_URL}/content/namespaces`, {
    method: 'POST',
    headers: authHeaders(userId),
    body: JSON.stringify(input)
  })
  await mutate(`${BASE_URL}/content/namespaces`)
  return result
}

export async function updateNamespace(id: string, input: Partial<Namespace>, userId: string) {
  const result = await jsonFetch<Namespace>(`${BASE_URL}/content/namespaces/${id}`, {
    method: 'PATCH',
    headers: authHeaders(userId),
    body: JSON.stringify(input)
  })
  await mutate(`${BASE_URL}/content/namespaces`)
  return result
}

export async function deactivateNamespace(id: string, userId: string) {
  await fetch(`${BASE_URL}/content/namespaces/${id}`, { 
    method: 'DELETE', 
    headers: authHeaders(userId), 
    credentials: 'include' 
  })
  await mutate(`${BASE_URL}/content/namespaces`)
}


