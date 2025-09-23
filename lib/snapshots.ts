import { kv } from './snapshotStore'

const SNAP_RESOURCE_PREFIX = 'snapshot-resource-'

export type ResourceSnapshot<T = any> = {
  id: string
  table?: string
  version: number
  savedAt: number
  data: T[]
}

const SNAP_VERSION = 1

export async function saveSnapshot(resourceId: string, table: string | undefined, rows: any[]) {
  const payload: ResourceSnapshot = { id: resourceId, table, version: SNAP_VERSION, savedAt: Date.now(), data: rows }
  await kv.setItem(`${SNAP_RESOURCE_PREFIX}${resourceId}`, JSON.stringify(payload))
}

export async function loadSnapshot<T = any>(resourceId: string): Promise<ResourceSnapshot<T> | null> {
  const raw = await kv.getItem(`${SNAP_RESOURCE_PREFIX}${resourceId}`)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as ResourceSnapshot<T>
    if (!Array.isArray(parsed?.data)) return null
    return parsed
  } catch { return null }
}

export async function clearSnapshot(resourceId: string) {
  await kv.removeItem(`${SNAP_RESOURCE_PREFIX}${resourceId}`)
}


