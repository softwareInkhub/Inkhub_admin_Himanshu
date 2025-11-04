'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { CustomCard } from '@/components/shared/types'
import { calculateCustomValue, formatCardValue } from '@/components/shared/utils/customCardCalculations'
import { X } from 'lucide-react'

interface CustomCardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (card: CustomCard) => void
  products?: any[]
  items?: any[]
  existingCards: CustomCard[]
  editingCard: CustomCard | null
  editingDefaultCard: string | null
}

export default function CustomCardModal({ isOpen, onClose, onSave, products, items, existingCards, editingCard }: CustomCardModalProps) {
  const baseItems = useMemo(() => Array.isArray(items) ? items : (Array.isArray(products) ? products : []), [items, products])

  // Form state
  const [title, setTitle] = useState(editingCard?.title || '')
  const [icon, setIcon] = useState(editingCard?.icon || '📈')
  const [color, setColor] = useState(editingCard?.color || 'from-blue-500 to-blue-600')
  const [field, setField] = useState(editingCard?.field || '')
  const [operation, setOperation] = useState<CustomCard['operation']>(editingCard?.operation || 'sum')
  const [selectedIds, setSelectedIds] = useState<string[]>(editingCard?.selectedProducts || [])
  const [isVisible, setIsVisible] = useState<boolean>(editingCard?.isVisible ?? true)
  const [search, setSearch] = useState<string>('')
  const [customFormula, setCustomFormula] = useState<string>('')
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic')

  useEffect(() => {
    if (editingCard) {
      setTitle(editingCard.title)
      setIcon(editingCard.icon)
      setColor(editingCard.color)
      setField(editingCard.field)
      setOperation(editingCard.operation)
      setSelectedIds(editingCard.selectedProducts)
      setIsVisible(editingCard.isVisible)
    }
  }, [editingCard])

  // Derive numeric candidate fields
  const numericFields = useMemo(() => {
    const first = baseItems.find(Boolean) || {}
    const keys = Object.keys(first || {})
    const candidates: string[] = []
    for (const k of keys) {
      const v = baseItems[0]?.[k]
      if (typeof v === 'number') candidates.push(k)
      // common numeric fields that may be string in first row
      if (['total','totalPrice','currentTotalPrice','price','cost','quantity','repins','likes','comments','pinCount','followers','downloads','views'].includes(k)) {
        if (!candidates.includes(k)) candidates.push(k)
      }
    }
    return candidates
  }, [baseItems])

  // Items list filtered by search
  const visibleItems = useMemo(() => {
    if (!search.trim()) return baseItems
    const q = search.toLowerCase()
    return baseItems.filter((it) => Object.values(it).some(v => String(v).toLowerCase().includes(q)))
  }, [baseItems, search])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAll = () => {
    setSelectedIds(visibleItems.map((it: any) => String(it.id)))
  }
  const clearAll = () => setSelectedIds([])

  const previewValue = useMemo(() => {
    if (!field) return 0
    const values = baseItems
      .filter((it: any) => selectedIds.includes(String(it.id)))
      .map((it: any) => Number(it[field]) || 0)
      .filter((n: number) => !Number.isNaN(n))
    return calculateCustomValue(values, operation, customFormula, baseItems.length)
  }, [baseItems, field, selectedIds, operation, customFormula])

  const presets = [
    { label: 'Blue', value: 'from-blue-500 to-blue-600' },
    { label: 'Green', value: 'from-green-500 to-green-600' },
    { label: 'Purple', value: 'from-purple-500 to-purple-600' },
    { label: 'Yellow', value: 'from-yellow-500 to-yellow-600' },
    { label: 'Orange', value: 'from-orange-500 to-orange-600' },
    { label: 'Indigo', value: 'from-indigo-500 to-indigo-600' }
  ]

  const iconChoices = ['📊','📈','💰','✅','⚠️','🔥','⭐','🎯','💎','🚀','📌','📋','🛒','🏷️','🧮','🧭','🧩']

  const handleSave = () => {
    if (!field) return
    const newCard: CustomCard = {
      id: editingCard?.id || `cc-${Date.now()}`,
      title: title || `${operation} of ${field}`,
      icon,
      color,
      field,
      operation,
      selectedProducts: selectedIds,
      isVisible
    }
    onSave(newCard)
    onClose()
  }
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div>
            <div className="text-base font-semibold text-gray-900">{editingCard ? 'Edit Custom Analytics Card' : 'Create Custom Analytics Card'}</div>
            <div className="text-xs text-gray-500">Build your own KPI card with custom calculations</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2.5 max-h-[68vh] overflow-auto">
          {/* Title + Field */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Card Title</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., Average Price of Selected Products" className="w-full border rounded-md px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data Field</label>
              <select value={field} onChange={e=>setField(e.target.value)} className="w-full border rounded-md px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a field</option>
                {numericFields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center justify-end gap-2">
            <button onClick={()=>setMode('basic')} className={`px-2 py-1 text-xs rounded ${mode==='basic'?'bg-blue-100 text-blue-700':'text-gray-600 hover:bg-gray-100'}`}>Basic</button>
            <button onClick={()=>setMode('advanced')} className={`px-2 py-1 text-xs rounded ${mode==='advanced'?'bg-blue-100 text-blue-700':'text-gray-600 hover:bg-gray-100'}`}>Advanced</button>
          </div>

          {/* Operations */}
          {mode==='basic' ? (
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">Calculation Operation</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1">
                {[
                  {k:'sum', l:'Sum', d:'Add all values'},
                  {k:'avg', l:'Average', d:'Calculate mean value'},
                  {k:'min', l:'Minimum', d:'Find lowest value'},
                  {k:'max', l:'Maximum', d:'Find highest value'},
                  {k:'count', l:'Count', d:'Count selected items'},
                  {k:'percentage', l:'Percentage', d:'Calculate percentage'},
                  {k:'difference', l:'Difference', d:'Calculate difference'},
                  {k:'custom', l:'Custom Formula', d:'Use custom calculation'},
                ].map(op => (
                  <button key={op.k} onClick={()=>setOperation(op.k as any)} className={`text-left border rounded-md p-2 hover:shadow-sm transition h-[54px] ${operation===op.k?'border-blue-500 bg-blue-50':'border-gray-200 bg-white'}`}>
                    <div className="text-[12px] font-medium text-gray-800 leading-4 truncate">{op.l}</div>
                    <div className="text-[10px] text-gray-500 leading-3 truncate">{op.d}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Formula display */}
              <div className="bg-[#0f172a] text-white rounded-lg p-3">
                <div className="flex items-center justify-between text-xs text-gray-300 mb-1"><span>Formula</span><span>{customFormula || ' '}</span></div>
                <div className="text-right text-[11px] text-gray-400">Result: {Number.isFinite(previewValue)?(Math.round(previewValue*100)/100):0}</div>
              </div>

              {/* Variable badges with live values */}
              {(() => {
                const nums = baseItems
                  .filter((it:any)=> selectedIds.includes(String(it.id)))
                  .map((it:any)=> Number(field ? it[field] : 0) || 0)
                  .filter((n:number)=> !Number.isNaN(n))
                const sum = nums.reduce((a:number,b:number)=>a+b,0)
                const count = nums.length
                const min = count>0 ? Math.min(...nums) : Infinity
                const max = count>0 ? Math.max(...nums) : 0
                const avg = count>0 ? sum/count : 0
                const vars = [
                  {k:'sum', v: sum},
                  {k:'count', v: count},
                  {k:'min', v: min},
                  {k:'max', v: max},
                  {k:'average', v: avg}
                ]
                const insert = (t:string) => { setCustomFormula((f)=> (f ? `${f} ${t}` : t)); setOperation('custom') }
                const add = (t:string) => setCustomFormula((f)=> f + t)
                const clear = () => setCustomFormula('')
                const back = () => setCustomFormula((f)=> f.slice(0, -1))
                return (
                  <>
                    <div className="text-xs text-gray-700">Available Variables</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {vars.map(v => (
                        <button key={v.k} onClick={()=>insert(v.k)} className="border rounded px-2 py-1 text-center text-[11px] bg-white hover:bg-gray-50">
                          <div className="uppercase tracking-wide text-gray-700">{v.k}</div>
                          <div className="text-[11px] text-gray-500">{Number.isFinite(v.v) ? (Math.round(v.v*100)/100) : 'Infinity'}</div>
                        </button>
                      ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[['7','8','9','/'],['4','5','6','*'],['1','2','3','-'],['0','.','=','+'],['(',' )','C','←']].map((row,ri)=> (
                        row.map((t,ci)=> {
                          const isOp = ['/','*','-','+','='].includes(t)
                          const cls = isOp ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 hover:bg-gray-200'
                          const onClick = () => {
                            if (t==='C') return clear()
                            if (t==='←') return back()
                            if (t==='=') { setOperation('custom'); return }
                            add(t)
                          }
                          return (
                            <button key={`${ri}-${ci}`} onClick={onClick} className={`rounded py-1.5 text-center text-[13px] ${cls}`}>{t}</button>
                          )
                        })
                      ))}
                    </div>

                    {/* Quick formulas */}
                    <div className="text-xs text-gray-700 mt-2">Quick Formulas</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                      {[
                        {l:'Sum + 10%', f:'sum * 1.10'},
                        {l:'Average per Item', f:'sum / count'},
                        {l:'Range', f:'max - min'},
                        {l:'Growth Rate', f:'(max - min) / max'}
                      ].map(q => (
                        <button key={q.l} onClick={()=>{ setCustomFormula(q.f); setOperation('custom') }} className="text-left px-2.5 py-1.5 rounded bg-green-50 text-green-700 text-[11px] border border-green-100 hover:bg-green-100">{q.l}</button>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          {/* Item select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-700">Select Items ({selectedIds.length} selected)</div>
              <div className="space-x-2">
                <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">Select All</button>
                <button onClick={clearAll} className="text-xs text-gray-600 hover:underline">Clear</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[0,1].map(col => (
                <div key={col} className="border rounded bg-white max-h-40 overflow-auto">
                  {visibleItems.filter((_,i)=> i%2===col).slice(0,200).map((it:any)=> (
                    <label key={String(it.id)} className="flex items-center justify-between px-2.5 py-1.5 border-b last:border-b-0 text-[13px]">
                      <span className="truncate mr-2">
                        {String(it.orderNumber || it.title || it.name || it.id)}
                        {field && typeof it[field] === 'number' && <span className="ml-2 text-[11px] text-gray-500">₹{Number(it[field]).toLocaleString()}</span>}
                      </span>
                      <input type="checkbox" checked={selectedIds.includes(String(it.id))} onChange={()=>toggleSelect(String(it.id))} className="rounded border-gray-300 text-blue-600" />
                    </label>
                  ))}
                  {visibleItems.length===0 && <div className="p-3 text-xs text-gray-500">No items</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Colors and Icons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">Color Theme</div>
              <div className="grid grid-cols-6 gap-2">
                {presets.map(p => (
                  <button key={p.value} onClick={()=>setColor(p.value)} className={`h-7 rounded-md bg-gradient-to-r ${p.value} border ${color===p.value?'border-blue-600':'border-transparent'}`}></button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">Icon</div>
              <div className="flex flex-wrap gap-2">
                {iconChoices.map(ic => (
                  <button key={ic} onClick={()=>setIcon(ic)} className={`h-8 w-8 flex items-center justify-center rounded-md border text-sm ${icon===ic?'border-blue-600 bg-blue-50':'border-gray-200 bg-white'}`}>{ic}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-md p-2">
            <div className="flex items-center justify-between gap-3">
              <div className="w-full max-w-xs">
                <div className={`rounded-md p-2.5 text-white bg-gradient-to-r ${color}`}>
                  <div className="flex items-center gap-1.5 text-[12px]"><span>{icon}</span><span className="truncate">{title || 'Card Title'}</span></div>
                  <div className="mt-0.5 text-lg font-semibold">{formatCardValue(previewValue, field || 'total')}</div>
                </div>
              </div>
              <label className="inline-flex items-center space-x-2 text-[13px] text-gray-700">
                <input type="checkbox" checked={isVisible} onChange={e=>setIsVisible(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                <span>Show card on dashboard</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t bg-gray-50">
          <button onClick={onClose} className="px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={!field} className="px-3.5 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">Create Card</button>
        </div>
      </div>
    </div>
  )
}


