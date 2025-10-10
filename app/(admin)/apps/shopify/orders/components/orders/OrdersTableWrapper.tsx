import { useEffect, useRef } from 'react'

export default function OrdersTableWrapper({
  Toolbar,
  children,
}: {
  Toolbar: React.ReactNode
  children: React.ReactNode
}) {
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = toolbarRef.current
    if (!el) return
    const setVar = () => {
      const h = el.getBoundingClientRect().height
      document.documentElement.style.setProperty('--orders-sticky-offset', `${h}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div ref={toolbarRef}>{Toolbar}</div>
      <div className="relative grow overflow-auto">{children}</div>
    </div>
  )
}


