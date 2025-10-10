'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Library, Plus, Filter, ChevronDown, LayoutGrid, Rows, MoreHorizontal } from 'lucide-react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ContentItem } from './types'
// Backend connections disabled - using dummy data only
import { contentItemSchema } from './schemas'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

function ContentFilters(props: { searchInput: string; setSearchInput: (v: string)=>void; types: string[]; status: string[]; labels: string[]; labelsSel: string[]; locale: string; createdFrom: string; createdTo: string; sizeMin: string; sizeMax: string; router: any; search: any; cn: any; }) {
  const { searchInput, setSearchInput, types, status, labels, labelsSel, locale, createdFrom, createdTo, sizeMin, sizeMax, router, search, cn } = props
  return (
    <aside className="col-span-12 md:col-span-3 space-y-2">
      <div className="bg-white border border-gray-200 rounded-md p-2">
        <div className="text-xs font-medium mb-2">Filters</div>
        <div className="space-y-2 text-xs text-gray-700">
          <input value={searchInput} onChange={(e)=>setSearchInput(e.target.value)} placeholder="Search title, labels, meta..." className="w-full border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          <div>
            <div className="mb-1 text-[11px] text-gray-500">Type</div>
            {['text','image','video','audio','file','json','richtext','html'].map(t => {
              const active = types.includes(t)
              return (
                <button key={t} onClick={()=>{
                  const params = new URLSearchParams(search.toString())
                  const next = new Set(types)
                  if (active) next.delete(t); else next.add(t)
                  if (next.size) params.set('type', Array.from(next).join(',')); else params.delete('type')
                  router.push(`/content-library?${params.toString()}`)
                }} className={cn('mr-1 mb-1 px-2 py-0.5 rounded border', active?'bg-blue-50 border-blue-300 text-blue-700':'border-gray-300 text-gray-700')}>
                  {t}
                </button>
              )
            })}
          </div>
          <div>
            <div className="mb-1 text-[11px] text-gray-500">Status</div>
            {['draft','published','archived'].map(s => {
              const active = status.includes(s)
              return (
                <button key={s} onClick={()=>{
                  const params = new URLSearchParams(search.toString())
                  const next = new Set(status)
                  if (active) next.delete(s); else next.add(s)
                  if (next.size) params.set('status', Array.from(next).join(',')); else params.delete('status')
                  router.push(`/content-library?${params.toString()}`)
                }} className={cn('mr-1 mb-1 px-2 py-0.5 rounded border', active?'bg-green-50 border-green-300 text-green-700':'border-gray-300 text-gray-700')}>
                  {s}
                </button>
              )
            })}
          </div>
          <div>
            <div className="mb-1 text-[11px] text-gray-500">Labels</div>
            <div className="flex flex-wrap">
              {(labels||[]).map(l => {
                const active = labelsSel.includes(l)
                return (
                  <button key={l} onClick={()=>{
                    const params = new URLSearchParams(search.toString())
                    const next = new Set(labelsSel)
                    if (active) next.delete(l); else next.add(l)
                    if (next.size) params.set('labels', Array.from(next).join(',')); else params.delete('labels')
                    router.push(`/content-library?${params.toString()}`)
                  }} className={cn('mr-1 mb-1 px-2 py-0.5 rounded-full border', active?'bg-purple-50 border-purple-300 text-purple-700':'border-gray-300 text-gray-700')}>
                    {l}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-[11px] text-gray-500">Created From</div>
              <input type="date" value={createdFrom} onChange={(e)=>{const p=new URLSearchParams(search.toString()); e.target.value?p.set('createdFrom',e.target.value):p.delete('createdFrom'); router.push(`/content-library?${p.toString()}`)}} className="w-full border rounded px-2 py-1"/>
            </div>
            <div>
              <div className="mb-1 text-[11px] text-gray-500">Created To</div>
              <input type="date" value={createdTo} onChange={(e)=>{const p=new URLSearchParams(search.toString()); e.target.value?p.set('createdTo',e.target.value):p.delete('createdTo'); router.push(`/content-library?${p.toString()}`)}} className="w-full border rounded px-2 py-1"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-[11px] text-gray-500">Min Bytes</div>
              <input type="number" value={sizeMin} onChange={(e)=>{const p=new URLSearchParams(search.toString()); e.target.value?p.set('sizeMin',e.target.value):p.delete('sizeMin'); router.push(`/content-library?${p.toString()}`)}} className="w-full border rounded px-2 py-1"/>
            </div>
            <div>
              <div className="mb-1 text-[11px] text-gray-500">Max Bytes</div>
              <input type="number" value={sizeMax} onChange={(e)=>{const p=new URLSearchParams(search.toString()); e.target.value?p.set('sizeMax',e.target.value):p.delete('sizeMax'); router.push(`/content-library?${p.toString()}`)}} className="w-full border rounded px-2 py-1"/>
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] text-gray-500">Locale</div>
            <input value={locale} onChange={(e)=>{const p=new URLSearchParams(search.toString()); e.target.value?p.set('locale',e.target.value):p.delete('locale'); router.push(`/content-library?${p.toString()}`)}} placeholder="en-IN" className="w-full border rounded px-2 py-1"/>
          </div>
        </div>
      </div>
    </aside>
  )
}

function ContentTable(props: { table: any; columns: any[]; parentRef: any; rowVirtualizer: any; cn: any; flexRender: any; dataLength: number; onLoadMore: ()=>void; canLoadMore: boolean; }) {
  const { table, columns, parentRef, rowVirtualizer, cn, flexRender, dataLength, onLoadMore, canLoadMore } = props
  return (
    <div className="bg-white border border-gray-200 rounded-md">
      <div className="px-3 py-2 text-xs text-gray-600 border-b flex items-center justify-between">
        <div>{dataLength} items</div>
      </div>
      <div className="h-[60vh] overflow-auto" ref={parentRef}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white border-b">
            {table.getHeaderGroups().map((hg: any) => (
              <tr key={hg.id}>
                {hg.headers.map((h: any) => (
                  <th key={h.id} className="px-2 py-2 text-left font-medium text-gray-700">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="p-0">
                <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
                  {rowVirtualizer.getVirtualItems().map((vRow: any) => {
                    const r = table.getRowModel().rows[vRow.index]
                    return (
                      <div key={r.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vRow.start}px)` }} className="hover:bg-gray-50 border-b">
                        <table className="w-full text-xs"><tbody><tr>
                          {r.getVisibleCells().map((c: any) => (
                            <td key={c.id} className="px-2 py-2 align-middle">{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                          ))}
                        </tr></tbody></table>
                      </div>
                    )
                  })}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 border-t flex items-center justify-between text-xs bg-white">
        <div>{dataLength} loaded</div>
        <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={!canLoadMore} onClick={onLoadMore}>Load more</button>
      </div>
    </div>
  )
}

function ContentCardGrid(props: { items: ContentItem[]; onOpen: (it: ContentItem)=>void; onHover: (it: ContentItem|null)=>void; }) {
  const { items, onOpen, onHover } = props
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
      {items.map(it => (
        <button key={it.id} className="border rounded-md p-2 text-xs hover:bg-gray-50 text-left" onClick={()=>onOpen(it)} onMouseEnter={()=>onHover(it)} onMouseLeave={()=>onHover(null)}>
          {it.previewUrl && (
            <div className="mb-1 rounded overflow-hidden bg-gray-100 aspect-video">
              <Image src={it.previewUrl} alt={it.title} width={480} height={270} sizes="(max-width: 768px) 50vw, 25vw" loading="lazy" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="font-medium text-gray-900 truncate" title={it.title}>{it.title}</div>
          <div className="text-[11px] text-gray-600">{it.status} • v{it.version}</div>
        </button>
      ))}
    </div>
  )
}

export default function ContentLibraryPage() {
  const router = useRouter()
  const search = useSearchParams()
  const { addTab } = useAppStore()

  // Register tab
  useEffect(() => {
    addTab({ title: 'Content Library', path: '/content-library', pinned: false, closable: true })
  }, [addTab])

  // Namespace filter (persisted via URL)
  const namespaceKey = search.get('ns') || ''
  const q = search.get('q') || ''
  const types = (search.get('type') || '').split(',').filter(Boolean)
  const status = (search.get('status') || '').split(',').filter(Boolean)
  const labelsSel = (search.get('labels') || '').split(',').filter(Boolean)
  const locale = search.get('locale') || ''
  const createdFrom = search.get('createdFrom') || ''
  const createdTo = search.get('createdTo') || ''
  const sizeMin = search.get('sizeMin') || ''
  const sizeMax = search.get('sizeMax') || ''
  const view = (search.get('view') as 'table'|'grid') || 'table'

  // Mock policies and namespaces data (no backend connection)
  const policies = { role: 'admin', permittedNamespaces: ['default', 'marketing', 'shopify-content'] }
  const namespaces = [
    { id: '1', key: 'default', name: 'Default Content', description: 'Default content namespace', tags: ['general'] },
    { id: '2', key: 'marketing', name: 'Marketing Content', description: 'Marketing campaigns and materials', tags: ['marketing', 'campaigns'] },
    { id: '3', key: 'shopify-content', name: 'Shopify Content', description: 'Product and store content', tags: ['shopify', 'products'] }
  ]

  const effectiveNs = useMemo(() => {
    if (namespaceKey) return namespaceKey
    // prefer last used namespace from zustand if available and permitted
    try {
      const last = useAppStore.getState().lastContentNamespace
      if (last && namespaces.find(n=>n.key===last)) return last
    } catch {}
    // default to first permitted namespace
    const permitted = namespaces.filter(n => policies.permittedNamespaces.includes(n.key))
    return permitted[0]?.key || namespaces[0]?.key || 'default'
  }, [namespaceKey])

  // Generate 50 dummy content items for testing
  const generateDummyItems = (): ContentItem[] => {
    // Ensure we're on the client side to avoid hydration issues
    if (typeof window === 'undefined') return []
    const types: ContentItem['type'][] = ['text', 'image', 'video', 'audio', 'file', 'json', 'richtext', 'html']
    const statuses: ContentItem['status'][] = ['draft', 'published', 'archived']
    const labels = ['marketing', 'social-media', 'product', 'announcement', 'tutorial', 'news', 'design', 'content']
    const locales = ['en-US', 'en-IN', 'es-ES', 'fr-FR', 'de-DE']
    
    return Array.from({ length: 50 }, (_, i) => {
      const type = types[i % types.length]
      const status = statuses[i % statuses.length]
      const itemLabels = labels.slice(0, Math.floor(Math.random() * 3) + 1)
      const locale = locales[i % locales.length]
      const size = Math.floor(Math.random() * 10000000) + 1000 // 1KB to 10MB
      const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
      const updatedDate = new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Updated within 7 days of creation
      
      return {
        id: `item-${i + 1}`,
        namespaceKey: 'default',
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Content ${i + 1}`,
        type,
        status,
        labels: itemLabels,
        locale,
        summary: `This is a sample ${type} content item for testing purposes. It contains relevant information about ${itemLabels.join(', ')}.`,
        bytes: size,
        version: Math.floor(Math.random() * 5) + 1,
        createdAt: createdDate.toISOString(),
        updatedAt: updatedDate.toISOString(),
        createdBy: `user-${Math.floor(Math.random() * 10) + 1}`,
        updatedBy: `user-${Math.floor(Math.random() * 10) + 1}`,
        storageKey: `storage/${type}/${i + 1}`,
        previewUrl: ['image', 'video'].includes(type) ? `https://picsum.photos/400/300?random=${i + 1}` : undefined,
        meta: {
          content: type === 'json' ? JSON.stringify({ sample: true, index: i + 1, type }) : 
                  type === 'richtext' ? `<p>Rich text content for item ${i + 1}</p>` :
                  type === 'html' ? `<div><h3>HTML Content ${i + 1}</h3><p>Sample HTML content</p></div>` :
                  `Sample ${type} content for testing item ${i + 1}`,
          filename: type === 'file' ? `sample-file-${i + 1}.pdf` : undefined,
          contentType: type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : type === 'audio' ? 'audio/mpeg' : 'application/octet-stream'
        }
      }
    })
  }

  // Use dummy data instead of API call for testing - generate once and filter
  const dummyItems = useMemo(() => {
    // Only generate dummy data on client side to avoid hydration issues
    if (typeof window === 'undefined') return []
    return generateDummyItems()
  }, []) // Generate once on mount
  
  // Filter dummy items based on current filters
  const data = useMemo(() => {
    let filtered = dummyItems
    
    // Apply search query
    if (q) {
      const query = q.toLowerCase()
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.summary?.toLowerCase().includes(query) ||
        item.labels.some(label => label.toLowerCase().includes(query)) ||
        JSON.stringify(item.meta).toLowerCase().includes(query)
      )
    }
    
    // Apply type filter
    if (types.length > 0) {
      filtered = filtered.filter(item => types.includes(item.type))
    }
    
    // Apply status filter
    if (status.length > 0) {
      filtered = filtered.filter(item => status.includes(item.status))
    }
    
    // Apply labels filter
    if (labelsSel.length > 0) {
      filtered = filtered.filter(item => labelsSel.some(label => item.labels.includes(label)))
    }
    
    // Apply locale filter
    if (locale) {
      filtered = filtered.filter(item => item.locale === locale)
    }
    
    // Apply date range filter
    if (createdFrom) {
      const fromDate = new Date(createdFrom)
      filtered = filtered.filter(item => new Date(item.createdAt) >= fromDate)
    }
    if (createdTo) {
      const toDate = new Date(createdTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(item => new Date(item.createdAt) <= toDate)
    }
    
    // Apply size range filter
    if (sizeMin) {
      const minBytes = parseInt(sizeMin)
      filtered = filtered.filter(item => (item.bytes || 0) >= minBytes)
    }
    if (sizeMax) {
      const maxBytes = parseInt(sizeMax)
      filtered = filtered.filter(item => (item.bytes || 0) <= maxBytes)
    }
    
    return filtered
  }, [dummyItems, q, types, status, labelsSel, locale, createdFrom, createdTo, sizeMin, sizeMax])
  
  // Use dummy labels for testing
  const labels = ['marketing', 'social-media', 'product', 'announcement', 'tutorial', 'news', 'design', 'content']

  // debounced search input state
  const [searchInput, setSearchInput] = useState(q)
  useEffect(() => setSearchInput(q), [q])
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(search.toString())
      if (searchInput) params.set('q', searchInput); else params.delete('q')
      router.push(`/content-library?${params.toString()}`)
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  // helpers
  const humanBytes = (n?: number) => {
    if (!n && n !== 0) return '—'
    const units = ['B','KB','MB','GB']
    let i=0, v=n
    while (v>=1024 && i<units.length-1){v/=1024;i++}
    return `${v.toFixed(v<10&&i>0?1:0)} ${units[i]}`
  }
  const relative = (iso?: string) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const diff = Date.now()-d.getTime()
    const mins = Math.round(diff/60000)
    if (mins<60) return `${mins}m ago`
    const hrs=Math.round(mins/60); if (hrs<24) return `${hrs}h ago`
    const days=Math.round(hrs/24); return `${days}d ago`
  }

  // table state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  
  // Stable row selection handler to prevent infinite loops
  const handleRowSelectionChange = useCallback((updater: any) => {
    setRowSelection(prev => {
      const newSelection = typeof updater === 'function' ? updater(prev) : updater
      return newSelection
    })
  }, [])
  const col = createColumnHelper<ContentItem>()
  const columns = useMemo(() => [
    col.display({
      id: 'select',
      header: () => (
        <input type="checkbox" checked={Object.keys(rowSelection).length>0 && Object.keys(rowSelection).length===data.length} onChange={(e)=>{
          if (e.target.checked){ const all: Record<string,boolean> = {}; data.forEach(r=>{all[r.id]=true}); setRowSelection(all)} else setRowSelection({})
        }}/>
      ),
      cell: ({ row }) => (
        <input type="checkbox" checked={!!rowSelection[row.original.id]} onChange={(e)=>setRowSelection(prev=>({...prev,[row.original.id]:e.target.checked}))}/>
      ),
      size: 36
    }),
    col.accessor('title', { header: 'Title', cell: info => (
      <button 
        className="font-medium text-gray-900 truncate hover:underline text-left" 
        title="Quick Preview" 
        onClick={()=>setPreviewItem(info.row.original)}
        onMouseEnter={()=>setHoveredItem(info.row.original)}
        onMouseLeave={()=>setHoveredItem(null)}
      >
        {info.getValue()}
      </button>
    ) }),
    col.accessor('type', { header: 'Type', cell: info => <span className="text-gray-700">{info.getValue()}</span>, size: 80 }),
    col.accessor('status', { header: 'Status', cell: info => (
      <span className={cn('px-1 rounded border text-xs',
        info.getValue()==='published'?'text-green-700 border-green-300': info.getValue()==='archived'?'text-gray-600 border-gray-300':'text-yellow-800 border-yellow-300')}>{info.getValue()}</span>
    ), size: 90 }),
    col.accessor('labels', { header: 'Labels', cell: info => (
      <div className="flex flex-wrap gap-1">{(info.getValue()||[]).slice(0,4).map(l=>(<span key={l} className="px-1 rounded-full border text-[10px] text-purple-700 border-purple-300">{l}</span>))}</div>
    ) }),
    col.accessor('bytes', { header: 'Size', cell: info => humanBytes(info.getValue()), size: 80 }),
    col.accessor('updatedAt', { header: 'Updated', cell: info => <span title={info.getValue()||''}>{relative(info.getValue())}</span>, size: 110 }),
    col.accessor('updatedBy', { header: 'Updated By', cell: info => <span>{info.getValue()}</span>, size: 120 }),
    col.accessor('version', { header: 'v', cell: info => <span>v{info.getValue()}</span>, size: 40 }),
    col.display({ id: 'actions', header: '', cell: ({ row }) => (
      <div className="relative group">
        <button className="p-1 rounded hover:bg-gray-100" title="Actions"><MoreHorizontal className="h-4 w-4"/></button>
        <div className="hidden group-focus-within:block absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg z-50 text-xs">
          <button onClick={()=>setEditItem(row.original)} className="w-full text-left px-3 py-2 hover:bg-gray-50">Edit</button>
          <button onClick={()=>setPreviewItem(row.original)} className="w-full text-left px-3 py-2 hover:bg-gray-50">Preview</button>
          <button onClick={async ()=>{
            // Mock publish action
            console.log('Publishing item:', row.original.id)
            alert('Published (Mock)')
          }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Publish</button>
          <button onClick={async ()=>{
            // Mock archive action
            console.log('Archiving item:', row.original.id)
            alert('Archived (Mock)')
          }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Archive</button>
          <button onClick={async ()=>{
            // Mock delete action
            if (confirm('Delete this item?')) {
              console.log('Deleting item:', row.original.id)
              alert('Deleted (Mock)')
            }
          }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600">Delete</button>
        </div>
      </div>
    ), size: 36 })
  ], [col, rowSelection, data])
  const table = useReactTable({ 
    data, 
    columns, 
    state: { rowSelection }, 
    onRowSelectionChange: handleRowSelectionChange, 
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  })

  // Simple table without virtualization for better performance

  const [showFilters, setShowFilters] = useState(true)
  const [viewMode, setViewMode] = useState<'table'|'grid'>(view)

  // Persist namespace and view into zustand
  useEffect(()=>{
    if (effectiveNs) {
      try { useAppStore.getState().setLastContentNamespace(effectiveNs) } catch {}
    }
  }, [effectiveNs])
  useEffect(()=>{
    try { useAppStore.getState().setLastContentView(viewMode) } catch {}
  }, [viewMode])
  const [showCreate, setShowCreate] = useState(false)
  const [createType, setCreateType] = useState<'text'|'json'|'richtext'|'image'|'video'|'audio'|'file'|'html'>('text')
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null)
  const [hoveredItem, setHoveredItem] = useState<ContentItem | null>(null)
  const [editItem, setEditItem] = useState<ContentItem | null>(null)
  const [editTab, setEditTab] = useState<'details'|'content'|'versions'|'audit'>('details')
  const [density, setDensity] = useState<'comfortable'|'compact'>('comfortable')
  const [accent, setAccent] = useState<'blue'|'indigo'|'cyan'>('blue')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadStep, setUploadStep] = useState<1|2|3>(1)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadType, setUploadType] = useState<'image'|'video'|'audio'|'file'>('image')
  const [showNamespaceManager, setShowNamespaceManager] = useState(false)
  const [editingNamespace, setEditingNamespace] = useState<any | null>(null)

  type CreateForm = {
    title: string
    type: 'text'|'json'|'richtext'|'html'
    labels: string
    locale?: string
    summary?: string
    content?: string
    meta?: string
  }
  const createForm = useForm<CreateForm>({
    defaultValues: { title: '', type: 'text', labels: '' },
  })

  const editForm = useForm<CreateForm>()
  const uploadForm = useForm<CreateForm>()
  const namespaceForm = useForm<{ name: string; key: string; description?: string; tags: string }>()
  // Mock versions data (no backend connection)
  const versions = editItem ? [
    { id: '1', contentId: editItem.id, version: 1, diffSummary: 'Initial version', changedFields: ['title'], createdBy: 'user-1', createdAt: editItem.createdAt },
    { id: '2', contentId: editItem.id, version: 2, diffSummary: 'Updated content', changedFields: ['content'], createdBy: 'user-2', createdAt: editItem.updatedAt }
  ] : []

  const isAdmin = (policies?.role ? String(policies.role).toLowerCase() : '') === 'admin'

  // Reset edit form when editItem changes
  useEffect(() => {
    if (editItem) {
      editForm.reset({
        title: editItem.title,
        type: editItem.type as any,
        labels: (editItem.labels || []).join(', '),
        locale: editItem.locale || '',
        summary: editItem.summary || '',
        content: editItem.meta?.content || '',
        meta: editItem.meta ? JSON.stringify(editItem.meta, null, 2) : ''
      })
    }
  }, [editItem, editForm])

  // Reset namespace form when editing namespace changes
  useEffect(() => {
    if (editingNamespace) {
      namespaceForm.reset({
        name: editingNamespace.name || '',
        key: editingNamespace.key || '',
        description: editingNamespace.description || '',
        tags: (editingNamespace.tags || []).join(', ')
      })
    } else {
      namespaceForm.reset({ name: '', key: '', description: '', tags: '' })
    }
  }, [editingNamespace, namespaceForm])

  // namespace select handler (sync to URL)
  const updateNs = (ns: string) => {
    const params = new URLSearchParams(search.toString())
    if (ns) params.set('ns', ns)
    router.push(`/content-library?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      {/* Sticky header positioned just below the tab bar */}
      <div className="sticky middle-14 z-40 bg-white/80 backdrop-blur border-b border-gray-200 shadow-soft">
        <div className="w-full px-2 py-2 grid grid-cols-12 gap-3 items-center">
          <div className="col-span-12 md:col-span-4 flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shadow-glow">
              <Library className="h-4 w-4 text-blue-600" />
            </div>
            <h1 className="text-base font-semibold gradient-text">Content Library</h1>
          </div>
          {/* Namespace combobox */}
          <div className="col-span-12 md:col-span-4 flex items-center gap-2">
            <label className="sr-only">Namespace</label>
            <select
              value={effectiveNs}
              onChange={(e) => updateNs(e.target.value)}
              className="flex-1 input text-xs"
            >
              {(namespaces || []).map(ns => (
                <option key={ns.key} value={ns.key}>{ns.name} ({ns.key})</option>
              ))}
            </select>
            {isAdmin && (
              <button 
                onClick={() => setShowNamespaceManager(true)}
                className="btn btn-ghost px-2 py-1 text-xs"
                title="Manage Namespaces"
              >
                ⚙️
              </button>
            )}
          </div>
           {/* Actions */}
          <div className="col-span-12 md:col-span-4 flex items-center justify-end gap-2">
            <div className="relative group">
              <button className="btn btn-primary px-3 py-1 text-xs flex items-center gap-1">
                <Plus className="h-3 w-3"/>Create <ChevronDown className="h-3 w-3"/>
              </button>
              <div className="hidden group-focus-within:block absolute mt-1 w-48 bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-soft z-50 text-xs overflow-hidden">
                <button onClick={()=>{ setCreateType('text'); setShowCreate(true) }} className="w-full text-left px-3 py-2 hover:bg-gray-50">New Text</button>
                <button onClick={()=>{ setCreateType('json'); setShowCreate(true) }} className="w-full text-left px-3 py-2 hover:bg-gray-50">New JSON</button>
                <button onClick={()=>{ setCreateType('richtext'); setShowCreate(true) }} className="w-full text-left px-3 py-2 hover:bg-gray-50">New Rich Text</button>
                <button onClick={()=>{ setCreateType('html'); setShowCreate(true) }} className="w-full text-left px-3 py-2 hover:bg-gray-50">New HTML</button>
                <div className="border-t my-1"></div>
                <button onClick={()=>{ setUploadType('image'); setShowUpload(true); setUploadStep(1) }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Upload Image</button>
                <button onClick={()=>{ setUploadType('video'); setShowUpload(true); setUploadStep(1) }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Upload Video</button>
                <button onClick={()=>{ setUploadType('audio'); setShowUpload(true); setUploadStep(1) }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Upload Audio</button>
                <button onClick={()=>{ setUploadType('file'); setShowUpload(true); setUploadStep(1) }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Upload File</button>
              </div>
            </div>
            <button onClick={() => setShowFilters(v => !v)} className="btn btn-secondary px-3 py-1 text-xs flex items-center gap-1">
              <Filter className="h-3 w-3"/> {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <div className="ml-2 inline-flex rounded-md overflow-hidden border shadow-soft">
              <button onClick={() => { setViewMode('table'); const p=new URLSearchParams(search.toString()); p.set('view','table'); router.push(`/content-library?${p.toString()}`)}} className={cn('px-2 py-1 text-xs flex items-center gap-1', viewMode==='table' ? 'bg-gray-100' : 'bg-white')} title="Table View"><Rows className="h-3 w-3"/></button>
              <button onClick={() => { setViewMode('grid'); const p=new URLSearchParams(search.toString()); p.set('view','grid'); router.push(`/content-library?${p.toString()}`)}} className={cn('px-2 py-1 text-xs flex items-center gap-1', viewMode==='grid' ? 'bg-gray-100' : 'bg-white')} title="Card/Grid View"><LayoutGrid className="h-3 w-3"/></button>
            </div>
          </div>
        </div>
      </div>

      {/* No spacer needed for sticky header */}

      {/* 2-pane layout in a separate container */}
      <div className="w-full px-4 py-3 grid grid-cols-12 gap-3">
        {/* Left: Filters (collapsible on mobile) */}
        {showFilters && (
          <aside className="col-span-12 md:col-span-3 space-y-2">
            <div className="card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium">Filters</div>
                <button 
                  onClick={() => {
                    const params = new URLSearchParams(search.toString())
                    params.delete('type')
                    params.delete('status')
                    params.delete('labels')
                    params.delete('createdFrom')
                    params.delete('createdTo')
                    params.delete('sizeMin')
                    params.delete('sizeMax')
                    params.delete('locale')
                    params.delete('q')
                    router.push(`/content-library?${params.toString()}`)
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2 text-xs text-gray-700">
                {/* Search */}
                <input value={searchInput} onChange={(e)=>setSearchInput(e.target.value)} placeholder="Search title, labels, meta..." className="input"/>
                {/* Type chips */}
                <div>
                  <div className="mb-1 text-[11px] text-gray-500">Type</div>
                  {['text','image','video','audio','file','json','richtext','html'].map(t => {
                    const active = types.includes(t)
                    return (
                      <button 
                        key={t} 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          const params = new URLSearchParams(search.toString())
                          const currentTypes = [...types]
                          
                          if (active) {
                            // Remove the type
                            const index = currentTypes.indexOf(t)
                            if (index > -1) {
                              currentTypes.splice(index, 1)
                            }
                          } else {
                            // Add the type
                            currentTypes.push(t)
                          }
                          
                          if (currentTypes.length > 0) {
                            params.set('type', currentTypes.join(','))
                          } else {
                            params.delete('type')
                          }
                          
                          router.push(`/content-library?${params.toString()}`)
                        }} 
                        className={cn('mr-1 mb-1 px-2 py-0.5 rounded border text-xs cursor-pointer transition-colors', 
                          active ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
                {/* Status chips */}
                <div>
                  <div className="mb-1 text-[11px] text-gray-500">Status</div>
                  {['draft','published','archived'].map(s => {
                    const active = status.includes(s)
                    return (
                      <button 
                        key={s} 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          const params = new URLSearchParams(search.toString())
                          const currentStatus = [...status]
                          
                          if (active) {
                            // Remove the status
                            const index = currentStatus.indexOf(s)
                            if (index > -1) {
                              currentStatus.splice(index, 1)
                            }
                          } else {
                            // Add the status
                            currentStatus.push(s)
                          }
                          
                          if (currentStatus.length > 0) {
                            params.set('status', currentStatus.join(','))
                          } else {
                            params.delete('status')
                          }
                          
                          router.push(`/content-library?${params.toString()}`)
                        }} 
                        className={cn('mr-1 mb-1 px-2 py-0.5 rounded border text-xs cursor-pointer transition-colors', 
                          active ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
                {/* Labels multi-select */}
                <div>
                  <div className="mb-1 text-[11px] text-gray-500">Labels</div>
                  <div className="flex flex-wrap">
                    {(labels||[]).map(l => {
                      const active = labelsSel.includes(l)
                      return (
                        <button 
                          key={l} 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            const params = new URLSearchParams(search.toString())
                            const currentLabels = [...labelsSel]
                            
                            if (active) {
                              // Remove the label
                              const index = currentLabels.indexOf(l)
                              if (index > -1) {
                                currentLabels.splice(index, 1)
                              }
                            } else {
                              // Add the label
                              currentLabels.push(l)
                            }
                            
                            if (currentLabels.length > 0) {
                              params.set('labels', currentLabels.join(','))
                          } else {
                            params.delete('labels')
                          }
                          
                          router.push(`/content-library?${params.toString()}`)
                          }} 
                          className={cn('mr-1 mb-1 px-2 py-0.5 rounded-full border text-xs cursor-pointer transition-colors', 
                            active ? 'bg-purple-50 border-purple-300 text-purple-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          {l}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* Date range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="mb-1 text-[11px] text-gray-500">Created From</div>
                    <input 
                      type="date" 
                      value={createdFrom} 
                      onChange={(e)=>{
                        const p = new URLSearchParams(search.toString())
                        if (e.target.value && e.target.value.trim()) {
                          p.set('createdFrom', e.target.value)
                        } else {
                          p.delete('createdFrom')
                        }
                        router.push(`/content-library?${p.toString()}`)
                      }} 
                      className="input text-xs"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] text-gray-500">Created To</div>
                    <input 
                      type="date" 
                      value={createdTo} 
                      onChange={(e)=>{
                        const p = new URLSearchParams(search.toString())
                        if (e.target.value && e.target.value.trim()) {
                          p.set('createdTo', e.target.value)
                        } else {
                          p.delete('createdTo')
                        }
                        router.push(`/content-library?${p.toString()}`)
                      }} 
                      className="input text-xs"
                    />
                  </div>
                </div>
                {/* Size range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="mb-1 text-[11px] text-gray-500">Min Bytes</div>
                    <input 
                      type="number" 
                      value={sizeMin} 
                      onChange={(e)=>{
                        const p = new URLSearchParams(search.toString())
                        if (e.target.value && e.target.value.trim() && parseInt(e.target.value) > 0) {
                          p.set('sizeMin', e.target.value)
                        } else {
                          p.delete('sizeMin')
                        }
                        router.push(`/content-library?${p.toString()}`)
                      }} 
                      placeholder="0"
                      className="input text-xs"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] text-gray-500">Max Bytes</div>
                    <input 
                      type="number" 
                      value={sizeMax} 
                      onChange={(e)=>{
                        const p = new URLSearchParams(search.toString())
                        if (e.target.value && e.target.value.trim() && parseInt(e.target.value) > 0) {
                          p.set('sizeMax', e.target.value)
                        } else {
                          p.delete('sizeMax')
                        }
                        router.push(`/content-library?${p.toString()}`)
                      }} 
                      placeholder="∞"
                      className="input text-xs"
                    />
                  </div>
                </div>
                {/* Locale */}
                <div>
                  <div className="mb-1 text-[11px] text-gray-500">Locale</div>
                  <input 
                    value={locale} 
                    onChange={(e)=>{
                      const p = new URLSearchParams(search.toString())
                      if (e.target.value && e.target.value.trim()) {
                        p.set('locale', e.target.value)
                      } else {
                        p.delete('locale')
                      }
                      router.push(`/content-library?${p.toString()}`)
                    }} 
                    placeholder="en-IN" 
                    className="input text-xs"
                  />
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Right: Results */}
        <section className={cn('col-span-12', showFilters ? 'md:col-span-9' : 'md:col-span-12')}>
          <div className="card p-0">
            <div className="px-3 py-2 text-xs text-gray-700 border-b flex items-center justify-between">
              <div>{data?.length || 0} items</div>
              {Object.keys(rowSelection).length>0 && (
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost px-2 py-1 text-xs">Publish</button>
                  <button className="btn btn-ghost px-2 py-1 text-xs">Archive</button>
                  <button className="btn btn-ghost px-2 py-1 text-xs">Apply Labels</button>
                  <button className="btn btn-ghost px-2 py-1 text-xs">Move Namespace</button>
                  <button className="btn btn-ghost px-2 py-1 text-xs text-red-600">Delete</button>
                </div>
              )}
            </div>
            {viewMode === 'table' ? (
              <div className="h-[70vh] overflow-auto scrollbar-thin">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white/90 backdrop-blur border-b">
                    {table.getHeaderGroups().map(hg => (
                      <tr key={hg.id}>
                        {hg.headers.map((h, index) => (
                          <th key={h.id} className={`px-3 py-2 text-left font-semibold text-gray-800 ${index === 0 ? 'w-12' : index === 1 ? 'w-48' : index === 2 ? 'w-20' : index === 3 ? 'w-24' : index === 4 ? 'w-32' : index === 5 ? 'w-20' : index === 6 ? 'w-24' : index === 7 ? 'w-24' : index === 8 ? 'w-12' : 'w-12'}`}>
                            {flexRender(h.column.columnDef.header, h.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row, rowIndex) => (
                      <tr key={row.id} className={`hover:bg-gray-50 border-b ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                        {row.getVisibleCells().map((cell, index) => (
                          <td key={cell.id} className={`px-3 py-2 align-middle ${index === 0 ? 'w-12' : index === 1 ? 'w-48' : index === 2 ? 'w-20' : index === 3 ? 'w-24' : index === 4 ? 'w-32' : index === 5 ? 'w-20' : index === 6 ? 'w-24' : index === 7 ? 'w-24' : index === 8 ? 'w-12' : 'w-12'}`}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 p-3">
                 {(data || []).map(it => (
                  <button 
                     key={it.id} 
                    className="border rounded-lg p-2 text-xs hover:bg-gray-50 text-left hover-lift"
                     onClick={()=>setPreviewItem(it)}
                     onMouseEnter={()=>setHoveredItem(it)}
                     onMouseLeave={()=>setHoveredItem(null)}
                   >
                    {it.previewUrl && (
                      <div className="mb-2 rounded-md overflow-hidden bg-gray-100 aspect-video">
                        <Image src={it.previewUrl} alt={it.title} width={480} height={270} sizes="(max-width: 768px) 50vw, 25vw" loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="font-medium text-gray-900 truncate" title={it.title}>{it.title}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] border border-gray-300 text-gray-700">{it.type}</span>
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] border', it.status==='published'?'text-green-700 border-green-300': it.status==='archived'?'text-gray-600 border-gray-300':'text-yellow-800 border-yellow-300')}>{it.status}</span>
                      <span className="text-[10px] text-gray-500 ml-auto">v{it.version}</span>
                    </div>
                   </button>
                 ))}
               </div>
             )}
            {/* Pagination footer */}
            <div className="px-3 py-2 border-t flex items-center justify-between text-xs bg-white rounded-b-lg">
              <div className="text-gray-600">{data.length} loaded</div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost px-2 py-1 disabled:opacity-50"
                  disabled={true}
                  onClick={()=> {}}
                >
                  Load more (disabled for demo)
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Hover Preview (for images/video) */}
      {hoveredItem && ['image','video'].includes(hoveredItem.type) && hoveredItem.previewUrl && (
        <div className="fixed z-[105] pointer-events-none" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="bg-white border-2 border-blue-500 rounded-md shadow-xl p-1 max-w-sm max-h-96 overflow-hidden">
            {hoveredItem.type === 'image' ? (
              <img src={hoveredItem.previewUrl} alt={hoveredItem.title} className="max-h-80 object-contain" />
            ) : (
              <video src={hoveredItem.previewUrl} autoPlay muted loop className="max-h-80" />
            )}
            <div className="text-[10px] text-gray-600 px-1 truncate">{hoveredItem.title}</div>
          </div>
        </div>
      )}

      {/* Quick Preview Modal (click) */}
      {previewItem && (
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center" onClick={()=>setPreviewItem(null)}>
          <div className="bg-white rounded-md border max-w-[90vw] max-h-[85vh] w-[900px] overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="px-4 py-2 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="text-sm font-semibold">Preview — {previewItem.title}</div>
              <button className="text-xs text-gray-600 hover:text-gray-900" onClick={()=>setPreviewItem(null)}>Close</button>
            </div>
            <div className="p-3 text-sm">
              {/* Image Preview */}
              {previewItem.type === 'image' && previewItem.previewUrl && (
                <div className="flex justify-center">
                  <img src={previewItem.previewUrl} alt={previewItem.title} className="max-h-[70vh] object-contain w-full" />
                </div>
              )}
              {/* Video Preview */}
              {previewItem.type === 'video' && previewItem.previewUrl && (
                <video src={previewItem.previewUrl} controls className="max-h-[70vh] w-full" />
              )}
              {/* JSON Preview with syntax highlighting */}
              {previewItem.type === 'json' && (
                <div className="relative">
                  <div className="absolute top-2 right-2 text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded">JSON</div>
                  <pre className="text-xs bg-gray-900 text-green-400 rounded p-3 overflow-auto max-h-[70vh] font-mono">
                    {JSON.stringify(previewItem.meta?.content || previewItem.meta || {}, null, 2)}
                  </pre>
                </div>
              )}
              {/* Text/HTML/RichText Preview */}
              {['text','html','richtext'].includes(previewItem.type) && (
                <div className="bg-gray-50 border rounded p-3 overflow-auto max-h-[70vh]">
                  {previewItem.type === 'html' ? (
                    <div dangerouslySetInnerHTML={{ __html: previewItem.meta?.content || previewItem.summary || '' }} />
                  ) : previewItem.type === 'richtext' ? (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewItem.meta?.content || previewItem.summary || '' }} />
                  ) : (
                    <pre className="text-xs whitespace-pre-wrap font-sans">{previewItem.meta?.content || previewItem.summary || 'No content available'}</pre>
                  )}
                </div>
              )}
              {/* Audio/File fallback */}
              {['audio','file'].includes(previewItem.type) && (
                <div className="text-center py-8 text-gray-500">
                  {previewItem.type === 'audio' && previewItem.previewUrl ? (
                    <audio src={previewItem.previewUrl} controls className="mx-auto" />
                  ) : (
                    <>
                      <div className="text-4xl mb-2">📄</div>
                      <div className="text-sm">{previewItem.type.toUpperCase()} file</div>
                      <div className="text-xs text-gray-400 mt-1">{humanBytes(previewItem.bytes)}</div>
                    </>
                  )}
                </div>
              )}
              {/* Metadata footer */}
              <div className="mt-4 pt-3 border-t text-xs text-gray-600 space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="font-medium">Type:</span> {previewItem.type}</div>
                  <div><span className="font-medium">Status:</span> {previewItem.status}</div>
                  <div><span className="font-medium">Size:</span> {humanBytes(previewItem.bytes)}</div>
                  <div><span className="font-medium">Version:</span> v{previewItem.version}</div>
                  <div><span className="font-medium">Updated:</span> {relative(previewItem.updatedAt)}</div>
                  <div><span className="font-medium">By:</span> {previewItem.updatedBy}</div>
                </div>
                {previewItem.labels && previewItem.labels.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-medium">Labels:</span>
                    {previewItem.labels.map(l => (
                      <span key={l} className="px-1 rounded-full border text-[10px] text-purple-700 border-purple-300">{l}</span>
                    ))}
                  </div>
                )}
                {previewItem.summary && (
                  <div><span className="font-medium">Summary:</span> {previewItem.summary}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal (basic for Text/JSON/RichText) */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-md border w-[720px] max-w-[95vw]">
            <div className="px-4 py-2 border-b flex items-center justify-between">
              <div className="text-sm font-semibold">New {createType === 'json' ? 'JSON' : createType === 'richtext' ? 'Rich Text' : 'Text'}</div>
              <button className="text-gray-500 text-xs" onClick={()=>setShowCreate(false)}>Close</button>
            </div>
            <form className="p-3 space-y-2 text-xs" onSubmit={createForm.handleSubmit(async (values)=>{
              try {
                // Mock create action
                console.log('Creating content item:', values)
                alert('Content item created successfully! (Mock)')
                setShowCreate(false)
              } catch (e) {
                console.error(e)
                alert('Failed to create')
              }
            })}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-gray-600">Title</label>
                  <input {...createForm.register('title', { required: true })} className="w-full border rounded px-2 py-1"/>
                </div>
                <div>
                  <label className="block mb-1 text-gray-600">Type</label>
                  <select {...createForm.register('type')} className="w-full border rounded px-2 py-1">
                    <option value="text">Text</option>
                    <option value="json">JSON</option>
                    <option value="richtext">Rich Text</option>
                    <option value="html">HTML</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-gray-600">Labels (comma)</label>
                  <input {...createForm.register('labels')} className="w-full border rounded px-2 py-1"/>
                </div>
                <div>
                  <label className="block mb-1 text-gray-600">Locale</label>
                  <input {...createForm.register('locale')} placeholder="en-IN" className="w-full border rounded px-2 py-1"/>
                </div>
                <div className="col-span-2">
                  <label className="block mb-1 text-gray-600">Summary</label>
                  <textarea {...createForm.register('summary')} className="w-full border rounded px-2 py-1" rows={2}/>
                </div>
                <div className="col-span-2">
                  <label className="block mb-1 text-gray-600">Content</label>
                  <textarea {...createForm.register('content')} className="w-full border rounded px-2 py-1" rows={6}/>
                </div>
                <div className="col-span-2">
                  <label className="block mb-1 text-gray-600">Meta (JSON)</label>
                  <textarea {...createForm.register('meta')} className="w-full border rounded px-2 py-1" rows={4} placeholder='{"key":"value"}'/>
                </div>
              </div>
              <div className="pt-2 border-t mt-2 flex items-center justify-end gap-2">
                <button type="button" className="px-3 py-1 border rounded" onClick={()=>setShowCreate(false)}>Cancel</button>
                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Drawer (side panel) */}
      {editItem && (
        <div className="fixed inset-0 z-[120] bg-black/30" onClick={()=>setEditItem(null)}>
          <div className="absolute right-0 top-0 bottom-0 w-[800px] max-w-[90vw] bg-white shadow-2xl overflow-hidden flex flex-col" onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div className="px-4 py-2 border-b flex items-center justify-between bg-gray-50">
              <div className="text-sm font-semibold">Edit — {editItem.title}</div>
              <button className="text-xs text-gray-600 hover:text-gray-900" onClick={()=>setEditItem(null)}>Close</button>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b bg-white">
              {(['details','content','versions','audit'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={()=>setEditTab(tab)}
                  className={cn('px-4 py-2 text-xs font-medium border-b-2 transition-colors', 
                    editTab===tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content (scrollable) */}
            <div className="flex-1 overflow-auto p-4">
              {editTab === 'details' && (
                <form className="space-y-3 text-xs" onSubmit={editForm.handleSubmit(async (values)=>{
                  try {
                    // Mock update action
                    console.log('Updating content item:', editItem.id, values)
                    alert('Content item updated successfully! (Mock)')
                    setEditItem(null)
                  } catch (e) {
                    console.error(e)
                    alert('Failed to save')
                  }
                })}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-gray-600 font-medium">Title</label>
                      <input {...editForm.register('title', { required: true })} className="w-full border rounded px-2 py-1"/>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 font-medium">Type</label>
                      <select {...editForm.register('type')} className="w-full border rounded px-2 py-1">
                        <option value="text">Text</option>
                        <option value="json">JSON</option>
                        <option value="richtext">Rich Text</option>
                        <option value="html">HTML</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="file">File</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 font-medium">Labels (comma)</label>
                      <input {...editForm.register('labels')} className="w-full border rounded px-2 py-1"/>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 font-medium">Locale</label>
                      <input {...editForm.register('locale')} placeholder="en-IN" className="w-full border rounded px-2 py-1"/>
                    </div>
                    <div className="col-span-2">
                      <label className="block mb-1 text-gray-600 font-medium">Summary</label>
                      <textarea {...editForm.register('summary')} className="w-full border rounded px-2 py-1" rows={2}/>
                    </div>
                  </div>
                  <div className="pt-3 border-t flex items-center justify-end gap-2">
                    <button type="button" className="px-3 py-1 border rounded" onClick={()=>setEditItem(null)}>Cancel</button>
                    <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Save Changes</button>
                  </div>
                </form>
              )}

              {editTab === 'content' && (
                <form className="space-y-3 text-xs" onSubmit={editForm.handleSubmit(async (values)=>{
                  try {
                    // Mock content save action
                    console.log('Saving content for item:', editItem.id, values.content)
                    alert('Content saved successfully! (Mock)')
                    setEditItem(null)
                  } catch (e) {
                    console.error(e)
                    alert('Failed to save content')
                  }
                })}>
                  <div>
                    <label className="block mb-1 text-gray-600 font-medium">Content</label>
                    <textarea {...editForm.register('content')} className="w-full border rounded px-2 py-1 font-mono text-xs" rows={20}/>
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-600 font-medium">Meta (JSON)</label>
                    <textarea {...editForm.register('meta')} className="w-full border rounded px-2 py-1 font-mono text-xs" rows={10} placeholder='{"key":"value"}'/>
                  </div>
                  <div className="pt-3 border-t flex items-center justify-end gap-2">
                    <button type="button" className="px-3 py-1 border rounded" onClick={()=>setEditItem(null)}>Cancel</button>
                    <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Save Content</button>
                  </div>
                </form>
              )}

              {editTab === 'versions' && (
                <div className="space-y-2 text-xs">
                  <div className="text-sm font-medium mb-3">Version History</div>
                  {(versions || []).length === 0 && <div className="text-gray-500 text-center py-8">No version history available</div>}
                  {(versions || []).map(v => (
                    <div key={v.version} className="border rounded p-2 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">v{v.version}</span>
                          <span className="text-gray-500 ml-2">{relative(v.createdAt)}</span>
                          <span className="text-gray-500 ml-2">by {v.createdBy}</span>
                        </div>
                        <button
                          onClick={async ()=>{
                            if (confirm(`Restore to version ${v.version}?`)) {
                              // Mock restore action
                              console.log('Restoring item to version:', editItem.id, v.version)
                              alert('Version restored successfully! (Mock)')
                              setEditItem(null)
                            }
                          }}
                          className="px-2 py-1 border rounded text-xs hover:bg-blue-50"
                        >
                          Restore
                        </button>
                      </div>
                      {v.changedFields && v.changedFields.length > 0 && (
                        <div className="mt-1 text-[10px] text-gray-600">
                          <span className="font-medium">Changed fields:</span> {v.changedFields.join(', ')}
                          {v.diffSummary && <div className="mt-1">{v.diffSummary}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {editTab === 'audit' && (
                <div className="space-y-2 text-xs">
                  <div className="text-sm font-medium mb-3">Audit Log</div>
                  <div className="border rounded p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="font-medium">ID:</span> {editItem.id}</div>
                      <div><span className="font-medium">Namespace:</span> {editItem.namespaceKey}</div>
                      <div><span className="font-medium">Created:</span> {editItem.createdAt}</div>
                      <div><span className="font-medium">Created By:</span> {editItem.createdBy}</div>
                      <div><span className="font-medium">Updated:</span> {editItem.updatedAt}</div>
                      <div><span className="font-medium">Updated By:</span> {editItem.updatedBy}</div>
                      <div><span className="font-medium">Version:</span> v{editItem.version}</div>
                      <div><span className="font-medium">Status:</span> {editItem.status}</div>
                    </div>
                  </div>
                  <div className="text-gray-500 text-center py-4">Full audit log not yet implemented</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Stepper Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-[125] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-md border w-[720px] max-w-[95vw]">
            <div className="px-4 py-2 border-b flex items-center justify-between">
              <div className="text-sm font-semibold">Upload {uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} — Step {uploadStep}/3</div>
              <button className="text-gray-500 text-xs" onClick={()=>{ setShowUpload(false); setUploadStep(1); setUploadFile(null); setUploadProgress(0) }}>Close</button>
            </div>

            {/* Stepper progress */}
            <div className="px-4 py-2 border-b flex items-center justify-between text-xs">
              <div className={cn('flex items-center gap-1', uploadStep>=1?'text-blue-600':'text-gray-400')}>
                <div className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center', uploadStep>=1?'border-blue-600 bg-blue-50':'border-gray-300')}>1</div>
                <span>Details</span>
              </div>
              <div className="flex-1 h-0.5 mx-2 bg-gray-200"><div className={cn('h-full bg-blue-600 transition-all', uploadStep>=2?'w-full':'w-0')}/></div>
              <div className={cn('flex items-center gap-1', uploadStep>=2?'text-blue-600':'text-gray-400')}>
                <div className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center', uploadStep>=2?'border-blue-600 bg-blue-50':'border-gray-300')}>2</div>
                <span>Upload</span>
              </div>
              <div className="flex-1 h-0.5 mx-2 bg-gray-200"><div className={cn('h-full bg-blue-600 transition-all', uploadStep>=3?'w-full':'w-0')}/></div>
              <div className={cn('flex items-center gap-1', uploadStep>=3?'text-blue-600':'text-gray-400')}>
                <div className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center', uploadStep>=3?'border-blue-600 bg-blue-50':'border-gray-300')}>3</div>
                <span>Finalize</span>
              </div>
            </div>

            <div className="p-4">
              {uploadStep === 1 && (
                <form className="space-y-3 text-xs" onSubmit={(e)=>{e.preventDefault(); if(uploadFile) setUploadStep(2)}}>
                  <div>
                    <label className="block mb-1 text-gray-600 font-medium">Select File</label>
                    <input 
                      type="file" 
                      accept={uploadType==='image'?'image/*':uploadType==='video'?'video/*':uploadType==='audio'?'audio/*':'*/*'}
                      onChange={(e)=>setUploadFile(e.target.files?.[0] || null)}
                      className="w-full border rounded px-2 py-1"
                    />
                    {uploadFile && (
                      <div className="mt-2 text-gray-600">
                        <div>Name: {uploadFile.name}</div>
                        <div>Size: {humanBytes(uploadFile.size)}</div>
                        <div>Type: {uploadFile.type}</div>
                      </div>
                    )}
                  </div>
                  {uploadFile && uploadType==='image' && (
                    <div className="border rounded p-2">
                      <div className="text-gray-600 mb-1">Preview:</div>
                      <img src={URL.createObjectURL(uploadFile)} alt="Preview" className="max-h-48 object-contain" />
                    </div>
                  )}
                  <div className="pt-3 border-t flex items-center justify-end gap-2">
                    <button type="button" className="px-3 py-1 border rounded" onClick={()=>setShowUpload(false)}>Cancel</button>
                    <button type="submit" disabled={!uploadFile} className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50">Next</button>
                  </div>
                </form>
              )}

              {uploadStep === 2 && uploadFile && (
                <div className="space-y-3 text-xs">
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">📤</div>
                    <div className="text-sm font-medium mb-1">Uploading {uploadFile.name}...</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{width: `${uploadProgress}%`}}></div>
                    </div>
                    <div className="text-gray-600 mt-1">{uploadProgress}%</div>
                  </div>
                  <button 
                    onClick={async ()=>{
                      try {
                        // Simulate upload progress
                        for (let i=0; i<=100; i+=10) {
                          setUploadProgress(i)
                          await new Promise(r=>setTimeout(r, 100))
                        }
                        setUploadStep(3)
                      } catch(e){ alert('Upload failed') }
                    }}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded"
                  >
                    Start Upload
                  </button>
                </div>
              )}

              {uploadStep === 3 && uploadFile && (
                <form className="space-y-3 text-xs" onSubmit={uploadForm.handleSubmit(async (values)=>{
                  try {
                    // Mock upload finalize action
                    console.log('Finalizing upload:', values, uploadFile?.name)
                    alert('Upload completed successfully! (Mock)')
                    setShowUpload(false)
                    setUploadStep(1)
                    setUploadFile(null)
                    setUploadProgress(0)
                  } catch (e) {
                    console.error(e)
                    alert('Failed to finalize upload')
                  }
                })}>
                  <div className="text-center py-2 text-green-600">
                    <div className="text-4xl mb-2">✅</div>
                    <div className="text-sm font-medium">Upload Complete</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block mb-1 text-gray-600 font-medium">Title</label>
                      <input {...uploadForm.register('title')} defaultValue={uploadFile.name} className="w-full border rounded px-2 py-1"/>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 font-medium">Labels (comma)</label>
                      <input {...uploadForm.register('labels')} className="w-full border rounded px-2 py-1"/>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 font-medium">Locale</label>
                      <input {...uploadForm.register('locale')} placeholder="en-IN" className="w-full border rounded px-2 py-1"/>
                    </div>
                    <div className="col-span-2">
                      <label className="block mb-1 text-gray-600 font-medium">Summary</label>
                      <textarea {...uploadForm.register('summary')} className="w-full border rounded px-2 py-1" rows={2}/>
                    </div>
                  </div>
                  <div className="pt-3 border-t flex items-center justify-end gap-2">
                    <button type="button" className="px-3 py-1 border rounded" onClick={()=>{setShowUpload(false); setUploadStep(1); setUploadFile(null)}}>Cancel</button>
                    <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Finalize</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Namespace Manager Modal (Admin Only) */}
      {showNamespaceManager && isAdmin && (
        <div className="fixed inset-0 z-[130] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-md border w-[900px] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b flex items-center justify-between">
              <div className="text-sm font-semibold">Manage Namespaces</div>
              <button className="text-gray-500 text-xs" onClick={()=>{ setShowNamespaceManager(false); setEditingNamespace(null) }}>Close</button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {/* Create/Edit Form */}
              <div className="mb-4 border rounded-md p-3 bg-gray-50">
                <div className="text-xs font-medium mb-2">{editingNamespace ? 'Edit Namespace' : 'Create New Namespace'}</div>
                <form className="space-y-2 text-xs" onSubmit={namespaceForm.handleSubmit(async (values)=>{
                  try {
                    // Mock namespace save action
                    if (editingNamespace) {
                      console.log('Updating namespace:', editingNamespace.id, values)
                      alert('Namespace updated successfully! (Mock)')
                    } else {
                      console.log('Creating namespace:', values)
                      alert('Namespace created successfully! (Mock)')
                    }
                    setEditingNamespace(null)
                    namespaceForm.reset({ name: '', key: '', description: '', tags: '' })
                  } catch (e) {
                    console.error(e)
                    alert('Failed to save namespace')
                  }
                })}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 text-gray-600 font-medium">Name</label>
                      <input {...namespaceForm.register('name', { required: true })} className="w-full border rounded px-2 py-1" placeholder="Marketing Content"/>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 font-medium">Key (unique)</label>
                      <input {...namespaceForm.register('key', { required: true })} className="w-full border rounded px-2 py-1" placeholder="marketing-content"/>
                    </div>
                    <div className="col-span-2">
                      <label className="block mb-1 text-gray-600 font-medium">Description</label>
                      <textarea {...namespaceForm.register('description')} className="w-full border rounded px-2 py-1" rows={2} placeholder="Content for marketing campaigns"/>
                    </div>
                    <div className="col-span-2">
                      <label className="block mb-1 text-gray-600 font-medium">Tags (comma-separated)</label>
                      <input {...namespaceForm.register('tags')} className="w-full border rounded px-2 py-1" placeholder="marketing, campaigns, social"/>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    {editingNamespace && (
                      <button type="button" className="px-3 py-1 border rounded" onClick={()=>{ setEditingNamespace(null); namespaceForm.reset() }}>Cancel Edit</button>
                    )}
                    <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
                      {editingNamespace ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Namespace List */}
              <div className="text-xs font-medium mb-2">Existing Namespaces</div>
              <div className="space-y-2">
                {(namespaces || []).map(ns => (
                  <div key={ns.id} className="border rounded-md p-2 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{ns.name}</div>
                        <div className="text-xs text-gray-600">Key: <span className="font-mono">{ns.key}</span></div>
                        {ns.description && <div className="text-xs text-gray-600 mt-1">{ns.description}</div>}
                        {ns.tags && ns.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {ns.tags.map(tag => (
                              <span key={tag} className="px-1 rounded-full border text-[10px] text-blue-700 border-blue-300">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button 
                          onClick={()=>setEditingNamespace(ns)} 
                          className="px-2 py-1 border rounded text-xs hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={async ()=>{
                            if (confirm(`Deactivate namespace "${ns.name}"? This cannot be undone.`)) {
                              // Mock deactivate action
                              console.log('Deactivating namespace:', ns.id)
                              alert('Namespace deactivated successfully! (Mock)')
                            }
                          }}
                          className="px-2 py-1 border border-red-300 text-red-600 rounded text-xs hover:bg-red-50"
                        >
                          Deactivate
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


