// Minimal IndexedDB wrapper with localStorage fallback.
// API: kv.getItem(key), kv.setItem(key, value), kv.removeItem(key)

export type KV = {
  getItem: (k: string) => Promise<string | null>
  setItem: (k: string, v: string) => Promise<void>
  removeItem: (k: string) => Promise<void>
}

function supportsIDB(): boolean {
  try { return typeof indexedDB !== 'undefined' } catch { return false }
}

function idbStore(dbName = 'inkhub-cache', storeName = 'snapshots'): KV {
  let dbPromise: Promise<IDBDatabase> | null = null

  function getDB(): Promise<IDBDatabase> {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const open = indexedDB.open(dbName, 1)
        open.onupgradeneeded = () => {
          const db = open.result
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName)
          }
        }
        open.onsuccess = () => resolve(open.result)
        open.onerror = () => reject(open.error)
      })
    }
    return dbPromise
  }

  return {
    async getItem(key: string) {
      const db = await getDB()
      return new Promise<string | null>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const req = store.get(key)
        req.onsuccess = () => resolve((req.result as string) ?? null)
        req.onerror = () => reject(req.error)
      })
    },
    async setItem(key: string, value: string) {
      const db = await getDB()
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const req = store.put(value, key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    },
    async removeItem(key: string) {
      const db = await getDB()
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const req = store.delete(key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    }
  }
}

function localStore(): KV {
  return {
    async getItem(key: string) { try { return localStorage.getItem(key) } catch { return null } },
    async setItem(key: string, value: string) { try { localStorage.setItem(key, value) } catch {} },
    async removeItem(key: string) { try { localStorage.removeItem(key) } catch {} }
  }
}

export const kv: KV = supportsIDB() ? idbStore() : localStore()


