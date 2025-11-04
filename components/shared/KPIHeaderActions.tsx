'use client'

import React, { useEffect, useMemo, useState } from 'react'
import CardManagerModal from './CardManagerModal'
import CustomCardModal from './CustomCardModal'

type KPIMetricsLike = Record<string, { label: string }>

interface KPIHeaderActionsProps {
  kpiMetrics: KPIMetricsLike
  items: any[]
  className?: string
}

export default function KPIHeaderActions({ kpiMetrics, items, className }: KPIHeaderActionsProps) {
  const [showCardManagerModal, setShowCardManagerModal] = useState(false)
  const [showCustomCardModal, setShowCustomCardModal] = useState(false)
  const [customCards, setCustomCards] = useState<any[]>([])
  const [defaultCardVisibility, setDefaultCardVisibility] = useState<Record<string, boolean>>({})

  // Hydrate persistent state (shared across pages)
  useEffect(() => {
    try { const cc = localStorage.getItem('shared-custom-cards'); if (cc) setCustomCards(JSON.parse(cc)) } catch {}
    try { const vis = localStorage.getItem('shared-default-card-visibility'); if (vis) setDefaultCardVisibility(JSON.parse(vis)) } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem('shared-custom-cards', JSON.stringify(customCards)) } catch {} }, [customCards])
  useEffect(() => { try { localStorage.setItem('shared-default-card-visibility', JSON.stringify(defaultCardVisibility)) } catch {} }, [defaultCardVisibility])

  // Ensure keys for current metrics exist
  useEffect(() => {
    const keys = Object.keys(kpiMetrics || {})
    const patch: Record<string, boolean> = {}
    keys.forEach(k => { if (defaultCardVisibility[k] === undefined) patch[k] = true })
    if (Object.keys(patch).length) setDefaultCardVisibility(prev => ({ ...prev, ...patch }))
  }, [kpiMetrics])

  const handleSaveCustomCard = (card: any) => {
    setCustomCards(prev => {
      const exists = prev.find((c: any) => c.id === card.id)
      if (exists) return prev.map((c: any) => (c.id === card.id ? card : c))
      return [...prev, card]
    })
    setShowCustomCardModal(false)
    setShowCardManagerModal(true)
    try { window.dispatchEvent(new CustomEvent('kpi-cards-updated', { detail: { type: 'save-custom' } })) } catch {}
  }
  const handleUpdateDefaultCard = (cardKey: string, isVisible: boolean) => {
    setDefaultCardVisibility(prev => ({ ...prev, [cardKey]: isVisible }))
    try { window.dispatchEvent(new CustomEvent('kpi-cards-updated', { detail: { type: 'update-default' } })) } catch {}
  }
  const handleUpdateCustomCard = (cardId: string, updates: Partial<any>) => {
    setCustomCards(prev => prev.map((c: any) => (c.id === cardId ? { ...c, ...updates } : c)))
    try { window.dispatchEvent(new CustomEvent('kpi-cards-updated', { detail: { type: 'update-custom' } })) } catch {}
  }
  const handleDeleteCustomCard = (cardId: string) => setCustomCards(prev => prev.filter((c: any) => c.id !== cardId))
  useEffect(() => { try { window.dispatchEvent(new CustomEvent('kpi-cards-updated', { detail: { type: 'delete-custom' } })) } catch {} }, [customCards.length])

  return (
    <>
      <div className={className}>
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setShowCardManagerModal(true)} className="px-2.5 py-1 text-xs border rounded-md bg-white hover:bg-gray-50 text-gray-700">Manage Cards</button>
          <button onClick={() => setShowCustomCardModal(true)} className="px-2.5 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700">+ Add Card</button>
        </div>
      </div>

      {showCustomCardModal && (
        <CustomCardModal
          isOpen={showCustomCardModal}
          onClose={() => setShowCustomCardModal(false)}
          onSave={handleSaveCustomCard}
          items={items}
          existingCards={customCards as any}
          editingCard={null as any}
          editingDefaultCard={null as any}
        />
      )}
      {showCardManagerModal && (
        <CardManagerModal
          isOpen={showCardManagerModal}
          onClose={() => setShowCardManagerModal(false)}
          customCards={customCards as any}
          defaultCards={Object.keys(kpiMetrics || {}).map(k => ({ key: k, label: (kpiMetrics as any)[k]?.label || k, isVisible: defaultCardVisibility[k] !== false }))}
          onUpdateCustomCard={handleUpdateCustomCard}
          onUpdateDefaultCard={handleUpdateDefaultCard}
          onDeleteCustomCard={handleDeleteCustomCard}
          onEditCustomCard={() => { setShowCardManagerModal(false); setShowCustomCardModal(true) }}
          onEditDefaultCard={() => { setShowCardManagerModal(false); setShowCustomCardModal(true) }}
        />
      )}
    </>
  )
}


