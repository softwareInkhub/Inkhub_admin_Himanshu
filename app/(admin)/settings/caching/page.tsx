'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Zap, 
  Package, 
  ShoppingCart, 
  ImageIcon, 
  BookOpen, 
  Palette, 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Database,
  Activity,
  TrendingUp,
  Settings,
  Pause,
  RotateCcw,
  AlertCircle,
  Info,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveSnapshot, loadSnapshot, clearSnapshot } from '@/lib/snapshots';

interface Resource {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  status: 'idle' | 'loading' | 'completed' | 'error' | 'paused';
  itemsLoaded: number;
  cacheHealth: 'healthy' | 'warning' | 'error' | 'unknown';
  lastUpdated: string | null;
  progress: number;
  error?: string;
  startTime?: string;
  estimatedTime?: number;
  retryCount: number;
  table?: string; // backend cache table name
  savedSnapshot?: boolean; // whether a local snapshot was saved
}

const initialResources: Resource[] = [
  {
    id: 'shopify-orders',
    name: 'Shopify Orders',
    icon: ShoppingCart,
    color: 'text-blue-600',
    status: 'idle',
    itemsLoaded: 0,
    cacheHealth: 'unknown',
    lastUpdated: null,
    progress: 0,
    retryCount: 0,
    table: 'shopify-inkhub-get-orders',
    savedSnapshot: false,
  },
  {
    id: 'shopify-products',
    name: 'Shopify Products',
    icon: Package,
    color: 'text-green-600',
    status: 'idle',
    itemsLoaded: 0,
    cacheHealth: 'unknown',
    lastUpdated: null,
    progress: 0,
    retryCount: 0,
    table: 'shopify-inkhub-get-products',
    savedSnapshot: false,
  },
  {
    id: 'pinterest-pins',
    name: 'Pinterest Pins',
    icon: ImageIcon,
    color: 'text-red-600',
    status: 'idle',
    itemsLoaded: 0,
    cacheHealth: 'unknown',
    lastUpdated: null,
    progress: 0,
    retryCount: 0,
    table: 'pinterest_inkhub_main_get_pins',
    savedSnapshot: false,
  },
  {
    id: 'pinterest-boards',
    name: 'Pinterest Boards',
    icon: BookOpen,
    color: 'text-pink-600',
    status: 'idle',
    itemsLoaded: 0,
    cacheHealth: 'unknown',
    lastUpdated: null,
    progress: 0,
    retryCount: 0,
    table: 'pinterest_inkhub_main_get_boards',
    savedSnapshot: false,
  },
  {
    id: 'design-library',
    name: 'Design Library Designs',
    icon: Palette,
    color: 'text-purple-600',
    status: 'idle',
    itemsLoaded: 0,
    cacheHealth: 'unknown',
    lastUpdated: null,
    progress: 0,
    retryCount: 0,
    table: 'admin-design-image',
    savedSnapshot: false,
  },
];

const statusConfig = {
  idle: { color: 'text-gray-500', bg: 'bg-gray-100', icon: Square },
  loading: { color: 'text-blue-500', bg: 'bg-blue-100', icon: RefreshCw },
  completed: { color: 'text-green-500', bg: 'bg-green-100', icon: CheckCircle },
  error: { color: 'text-red-500', bg: 'bg-red-100', icon: XCircle },
  paused: { color: 'text-yellow-500', bg: 'bg-yellow-100', icon: Pause },
};

const healthConfig = {
  healthy: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
  warning: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle },
  error: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  unknown: { color: 'text-gray-600', bg: 'bg-gray-50', icon: Clock },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.idle;
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.bg, config.color)}>
      <Icon className={cn('h-3 w-3', status === 'loading' && 'animate-spin')} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function HealthBadge({ health }: { health: string }) {
  const config = healthConfig[health as keyof typeof healthConfig] || healthConfig.unknown;
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.bg, config.color)}>
      <Icon className="h-3 w-3" />
      {health.charAt(0).toUpperCase() + health.slice(1)}
    </span>
  );
}

export default function SystemEngineDashboard() {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [overallProgress, setOverallProgress] = useState(0);
  const [completedResources, setCompletedResources] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [useLocalSnapshotFirst, setUseLocalSnapshotFirst] = useState(true);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const controllersRef = useRef<{ [id: string]: AbortController | undefined }>({});

  const BACKEND_URL = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001', []);
  const PROJECT = 'my-app';

  // Add tab for this page
  useEffect(() => {
    const path = window.location.pathname;
    const { addTab } = require('@/lib/store').useAppStore.getState();
    addTab({
      title: 'Caching Settings',
      path,
      pinned: false,
      closable: true,
    });
  }, []);
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

  // Calculate overall progress
  useEffect(() => {
    const total = resources.length;
    const completed = resources.filter(r => r.status === 'completed').length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    setOverallProgress(progress);
    setCompletedResources(completed);
  }, [resources]);

  // Helper to resiliently parse API JSON
  function safeJson<T = any>(val: any): T | null {
    try { return val as T } catch { return null }
  }

  async function fetchJson(url: string, controller?: AbortController, maxRetries: number = 6) {
    let attempt = 0
    let lastError: any = null
    while (attempt < maxRetries) {
      try {
        const tsParam = `ts=${Date.now()}`
        const sep = url.includes('?') ? '&' : '?'
        const bustUrl = `${url}${sep}${tsParam}`

        // Manual timeout in addition to AbortController to protect against hanging connections
        const timeout = setTimeout(() => {
          try { controller?.abort() } catch {}
        }, 30000)

        const res = await fetch(bustUrl, {
          signal: controller?.signal,
          cache: 'no-store',
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'identity' }
        })
        clearTimeout(timeout)
        if (!res.ok) throw new Error(`Request failed ${res.status}`)
        try {
          const text = await res.text()
          return JSON.parse(text)
        } catch (parseErr: any) {
          // Retry JSON parse errors, often due to truncated bodies (CONTENT_LENGTH_MISMATCH)
          throw new Error(`JSON_PARSE_ERROR: ${parseErr?.message || 'Unexpected end of input'}`)
        }
      } catch (err: any) {
        lastError = err
        // Retry on network errors like ERR_CONTENT_LENGTH_MISMATCH/TypeError
        const message = String(err?.message || '')
        const retriable = /NetworkError|TypeError|CONTENT_LENGTH_MISMATCH|Failed to fetch|timeout|JSON_PARSE_ERROR/i.test(message)
        attempt++
        if (!retriable || attempt >= maxRetries) break
        await new Promise(r => setTimeout(r, 400 * attempt))
      }
    }
    throw lastError || new Error('Request failed')
  }

  // Local snapshot helpers
  const SNAP_RESOURCE_PREFIX = 'snapshot-resource-'
  const SNAP_CHUNK_PREFIX = 'orders-chunk-snapshot-'
  // Replaced with centralized snapshot helpers (IndexedDB with localStorage fallback)
  const saveOrderChunkSnapshot = (chunkNumber: number, rows: any[]) => {
    try {
      const payload = { data: rows, savedAt: Date.now() }
      localStorage.setItem(`${SNAP_CHUNK_PREFIX}${chunkNumber}`, JSON.stringify(payload))
    } catch {}
  }

  // Start cache loading for a single resource by reading keys and chunks from backend cache
  const startResource = async (resourceId: string, options?: { bypassSnapshot?: boolean }) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;
    const table = resource.table;

    setLoadingStates(prev => ({ ...prev, [resourceId]: true }));
    
    setResources(prev => prev.map(r => 
      r.id === resourceId 
        ? { 
            ...r, 
            status: 'loading', 
            progress: 0, 
            itemsLoaded: 0,
            startTime: new Date().toISOString(),
            error: undefined
          }
        : r
    ));

    try {
      const controller = new AbortController();
      controllersRef.current[resourceId] = controller;

      if (!table) throw new Error('No table configured');

      // Try local snapshot first unless bypassed
      if (!options?.bypassSnapshot && useLocalSnapshotFirst) {
        const snap = await loadSnapshot(resourceId)
        if (snap && Array.isArray(snap.data) && snap.data.length > 0) {
          setResources(prev => prev.map(r =>
            r.id === resourceId
              ? {
                  ...r,
                  status: 'completed',
                  progress: 100,
                  itemsLoaded: snap.data.length,
                  cacheHealth: 'healthy',
                  savedSnapshot: true,
                  lastUpdated: new Date(snap.savedAt).toISOString()
                }
              : r
          ))
          setLoadingStates(prev => ({ ...prev, [resourceId]: false }))
          const c = controllersRef.current[resourceId]; if (c) delete controllersRef.current[resourceId]
          return
        }
      }

      // 1) Get available keys for the table
      const keysUrl = `${BACKEND_URL}/cache/data?project=${PROJECT}&table=${encodeURIComponent(table)}`;
      const keysJson = await fetchJson(keysUrl, controller);
      const keysList: string[] = (keysJson?.keys as string[]) || (keysJson?.data as string[]) || [];

      // Prefer 'all' aggregate if available
      if (keysList.includes('all')) {
        const allUrl = `${BACKEND_URL}/cache/data?project=${PROJECT}&table=${encodeURIComponent(table)}&key=all`;
        const allJson = await fetchJson(allUrl, controller);
        const allRows = Array.isArray(allJson?.data) ? allJson.data : (Array.isArray(allJson) ? allJson : []);
        const totalItems = allRows.length;

        if (totalItems > 0) {
          // Save full resource snapshot for durability
          await saveSnapshot(resourceId, table, allRows)
          setResources(prev => prev.map(r => 
            r.id === resourceId 
              ? { 
                  ...r,
                  status: 'completed',
                  progress: 100,
                  itemsLoaded: totalItems,
                  lastUpdated: new Date().toISOString(),
                  cacheHealth: 'healthy',
                  savedSnapshot: true
                }
              : r
          ));
          return;
        }
        // If 'all' exists but empty, treat as no data and fall through to chunk logic to double-check
      }

      const chunkKeys = keysList.filter(k => /^chunk:?\d+$/i.test(String(k)) || /^chunk:\d+$/i.test(String(k)));

      // fallback: if keys API didn't return chunks, attempt conservative probe of only chunk:0
      let keysToFetch = chunkKeys;
      if (keysToFetch.length === 0) {
        keysToFetch = ['chunk:0'];
      }

      let totalItems = 0;
      const totalChunks = keysToFetch.length;
      let skippedChunks = 0
      for (let i = 0; i < keysToFetch.length; i++) {
        const key = keysToFetch[i];
        const url = `${BACKEND_URL}/cache/data?project=${PROJECT}&table=${encodeURIComponent(table)}&key=${encodeURIComponent(key)}`;
        try {
          const json = await fetchJson(url, controller);
          const rows = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
          totalItems += rows.length;
          // If this is orders table with chunk:X keys, persist per-chunk snapshot
          if (/^chunk:\d+$/i.test(String(key)) && table === 'shopify-inkhub-get-orders') {
            const num = parseInt(String(key).split(':')[1])
            if (!isNaN(num)) saveOrderChunkSnapshot(num, rows)
          }
        } catch (err: any) {
          // If a chunk is missing, consider as end of data for probe mode
          if (keysList.length === 0 && /404|Request failed/.test(String(err?.message))) {
            // stop probing further and try 'all' as a final fallback
            try {
              const allUrl = `${BACKEND_URL}/cache/data?project=${PROJECT}&table=${encodeURIComponent(table)}&key=all`;
              const allJson = await fetchJson(allUrl, controller);
              const allRows = Array.isArray(allJson?.data) ? allJson.data : (Array.isArray(allJson) ? allJson : []);
              totalItems += allRows.length;
            } catch {}
            break;
          }
          // For transient network issues (like CONTENT_LENGTH_MISMATCH), skip this chunk and continue
          const msg = String(err?.message || '')
          if (/CONTENT_LENGTH_MISMATCH|JSON_PARSE_ERROR|Failed to fetch|timeout|NetworkError|TypeError/i.test(msg)) {
            skippedChunks++
          } else {
            throw err
          }
        }

        const progress = totalChunks > 0 ? Math.min(100, Math.round(((i + 1) / totalChunks) * 100)) : Math.min(100, (i + 1) * 10);
        setResources(prev => prev.map(r => 
          r.id === resourceId 
            ? { 
                ...r, 
                progress, 
                itemsLoaded: totalItems,
                lastUpdated: new Date().toISOString(),
                cacheHealth: 'healthy'
              }
            : r
        ));
      }

      if (totalItems > 0) {
        setResources(prev => prev.map(r => 
          r.id === resourceId 
            ? { 
                ...r, 
                status: 'completed', 
                progress: 100, 
                itemsLoaded: totalItems,
                cacheHealth: skippedChunks > 0 ? 'warning' : 'healthy',
                lastUpdated: new Date().toISOString(),
                savedSnapshot: true
              }
            : r
        ));
      } else {
        throw new Error(`No cache data found for table ${table}`)
      }
    } catch (error: any) {
      const message = String(error?.message || '')
      // Gracefully handle empty cache (404) as "no data yet" instead of hard error
      if (/404/.test(message)) {
        setResources(prev => prev.map(r => 
          r.id === resourceId 
            ? { 
                ...r, 
                status: 'idle',
                progress: 0,
                itemsLoaded: 0,
                cacheHealth: 'unknown',
                error: undefined
              }
            : r
        ))
      } else {
        setResources(prev => prev.map(r => 
          r.id === resourceId 
            ? { 
                ...r, 
                status: 'error', 
                error: message,
                retryCount: r.retryCount + 1
              }
            : r
        ));
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [resourceId]: false }));
      const c = controllersRef.current[resourceId];
      if (c) delete controllersRef.current[resourceId];
    }
  };

  const stopResource = (resourceId: string) => {
    const c = controllersRef.current[resourceId];
    if (c) c.abort();
    setResources(prev => prev.map(r => 
      r.id === resourceId 
        ? { 
            ...r, 
            status: r.status === 'loading' ? 'paused' : 'idle', 
            progress: r.status === 'loading' ? r.progress : 0, 
            itemsLoaded: r.status === 'loading' ? r.itemsLoaded : 0 
          }
        : r
    ));
  };

  const pauseResource = (resourceId: string) => {
    const c = controllersRef.current[resourceId];
    if (c) c.abort();
    setResources(prev => prev.map(r => 
      r.id === resourceId 
        ? { ...r, status: 'paused' }
        : r
    ));
  };

  const retryResource = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (resource && resource.status === 'error') {
      startResource(resourceId);
    }
  };

  const clearResource = async (resourceId: string) => {
    setResources(prev => prev.map(r => 
      r.id === resourceId 
        ? { 
            ...r, 
            status: 'idle', 
            progress: 0, 
            itemsLoaded: 0, 
            error: undefined,
            retryCount: 0,
            lastUpdated: null
          }
        : r
    ));
    try { await clearSnapshot(resourceId) } catch {}
  };

  const refreshAll = () => {
    setShowConfirmReset(true);
  };

  const confirmRefreshAll = () => {
    setResources(prev => prev.map(r => ({ 
      ...r, 
      status: 'idle', 
      progress: 0, 
      itemsLoaded: 0, 
      error: undefined,
      retryCount: 0,
      lastUpdated: null
    })));
    setShowConfirmReset(false);
  };

  const startAll = async () => {
    const idleResources = resources.filter(r => r.status === 'idle');
    for (const resource of idleResources) {
      await startResource(resource.id);
    }
  };

  const stopAll = () => {
    Object.values(controllersRef.current).forEach(c => c?.abort());
    setResources(prev => prev.map(r => 
      r.status === 'loading' 
        ? { ...r, status: 'paused' }
        : r
    ));
  };

  return (
    <div className="p-6 w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Engine Dashboard</h1>
            <p className="text-gray-600">Manage and monitor data caching across all resources</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
          <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{completedResources} of {resources.length} resources loaded</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              Overall Progress: {overallProgress.toFixed(0)}%
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 mr-2">
              <label className="text-sm text-gray-700">Use local snapshot first</label>
              <button
                onClick={() => setUseLocalSnapshotFirst(v => !v)}
                className={cn(
                  "px-2 py-1 rounded text-sm border",
                  useLocalSnapshotFirst ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-gray-50 border-gray-300 text-gray-700"
                )}
                title="When ON, Start will load from local snapshot if available and skip cloud fetch."
              >
                {useLocalSnapshotFirst ? 'ON' : 'OFF'}
              </button>
            </div>
            <button
              onClick={startAll}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={!resources.some(r => r.status === 'idle')}
            >
              <Play className="h-4 w-4" />
              Start All
            </button>
            <button
              onClick={stopAll}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              disabled={!resources.some(r => r.status === 'loading')}
            >
              <Pause className="h-4 w-4" />
              Pause All
            </button>
            <button
              onClick={refreshAll}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh All
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">System Progress</span>
          <span className="text-sm text-gray-500">{overallProgress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <div key={resource.id} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Icon className={cn('h-6 w-6', resource.color)} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{resource.name}</h3>
                    <StatusBadge status={resource.status} />
                  </div>
                </div>
                <div className="flex gap-1">
                  {/* Save snapshot/export button */}
                  {resource.status === 'completed' && (
                    <button
                      onClick={async () => {
                        try {
                          const snap = await loadSnapshot(resource.id)
                          if (!snap || !snap.data || snap.data.length === 0) {
                            alert('No snapshot found. Start this resource first to save a snapshot.')
                            return
                          }
                          const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `${resource.id}-snapshot.json`
                          a.click()
                          URL.revokeObjectURL(url)
                        } catch (e) {
                          alert('Failed to export snapshot')
                        }
                      }}
                      className="px-3 py-1 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      title="Export Snapshot"
                    >
                      Export
                    </button>
                  )}
                  {/* Import snapshot */}
                  {(['idle','completed','error','paused'] as Array<Resource['status']>).includes(resource.status) && (
                    <label className="px-3 py-1 rounded text-sm font-medium bg-white border text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer">
                      Import
                      <input
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={async (e) => {
                          try {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const text = await file.text()
                            const parsed = JSON.parse(text)
                            if (!Array.isArray(parsed?.data)) { alert('Invalid snapshot file.'); return }
                            await saveSnapshot(resource.id, parsed.table, parsed.data)
                            setResources(prev => prev.map(r => r.id === resource.id ? {
                              ...r,
                              status: 'completed',
                              progress: 100,
                              itemsLoaded: parsed.data.length,
                              cacheHealth: 'healthy',
                              savedSnapshot: true,
                              lastUpdated: new Date().toISOString()
                            } : r))
                            ;(e.target as HTMLInputElement).value = ''
                            alert(`Imported snapshot for ${resource.name} (${parsed.data.length} items).`)
                          } catch { alert('Failed to import snapshot.') }
                        }}
                      />
                    </label>
                  )}
                  {resource.status === 'idle' && (
                    <button
                      onClick={() => startResource(resource.id)}
                      disabled={loadingStates[resource.id]}
                      className="px-3 py-1 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                      title="Start"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                  )}
                  {resource.status === 'loading' && (
                    <>
                      <button
                        onClick={() => pauseResource(resource.id)}
                        className="px-3 py-1 rounded text-sm font-medium bg-yellow-600 text-white hover:bg-yellow-700 transition-colors"
                        title="Pause"
                      >
                        <Pause className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => stopResource(resource.id)}
                        className="px-3 py-1 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                        title="Stop"
                      >
                        <Square className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  {resource.status === 'paused' && (
                    <>
                      <button
                        onClick={() => startResource(resource.id)}
                        className="px-3 py-1 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                        title="Resume"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => stopResource(resource.id)}
                        className="px-3 py-1 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                        title="Stop"
                      >
                        <Square className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  {resource.status === 'error' && (
                    <>
                      <button
                        onClick={() => retryResource(resource.id)}
                        className="px-3 py-1 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        title="Retry"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => clearResource(resource.id)}
                        className="px-3 py-1 rounded text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                        title="Clear"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  {resource.status === 'completed' && (
                    <button
                      onClick={() => clearResource(resource.id)}
                      className="px-3 py-1 rounded text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                      title="Clear"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Info */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items Loaded:</span>
                  <span className="font-medium">{resource.itemsLoaded.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cache Health:</span>
                  <HealthBadge health={resource.cacheHealth} />
                </div>

                {resource.lastUpdated && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="text-gray-500">
                      {new Date(resource.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {resource.retryCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Retry Count:</span>
                    <span className="text-orange-600 font-medium">{resource.retryCount}</span>
                  </div>
                )}

                {/* Progress Bar */}
                {(resource.status === 'loading' || resource.status === 'paused') && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{resource.status === 'paused' ? 'Paused' : 'Loading...'}</span>
                      <span>{resource.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn(
                          'h-2 rounded-full transition-all duration-300',
                          resource.status === 'paused' ? 'bg-yellow-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${resource.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {resource.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-red-700 text-xs">
                        <div className="font-medium mb-1">Error:</div>
                        <div>{resource.error}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* System Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">Active Resources</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">
            {resources.filter(r => r.status === 'loading').length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-gray-900">Completed</span>
          </div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {completedResources}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-gray-900">Total Items</span>
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-2">
            {resources.reduce((sum, r) => sum + r.itemsLoaded, 0).toLocaleString()}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-gray-900">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-orange-600 mt-2">
            {resources.length > 0 ? ((completedResources / resources.length) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Reset</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will reset all resources to their initial state. Any progress will be lost. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRefreshAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
