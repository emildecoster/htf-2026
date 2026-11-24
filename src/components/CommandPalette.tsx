import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Command, LayoutDashboard, Radio, Search, X } from 'lucide-react'

const commands = [
  { label: 'Open Overview', hint: 'Dashboard and mission status', path: '/', icon: LayoutDashboard, keywords: 'home dashboard overview' },
  { label: 'Report an Echo', hint: 'Submit a new field transmission', path: '/report-echo', icon: Radio, keywords: 'echo report anomaly' },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const filtered = useMemo(() => commands.filter((item) => `${item.label} ${item.hint} ${item.keywords}`.toLowerCase().includes(query.toLowerCase())), [query])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen((value) => !value); setQuery('') }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!open) return <button type="button" className="command-palette-trigger" onClick={() => setOpen(true)} aria-label="Open command palette"><Command size={15} /><span>COMMAND</span><kbd>CTRL K</kbd></button>

  return (
    <div className="command-palette-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="command-palette-search"><Search size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands…" /><kbd>ESC</kbd><button type="button" onClick={() => setOpen(false)} aria-label="Close command palette"><X size={17} /></button></div>
        <p className="command-palette-label">MISSION COMMANDS</p>
        <div className="command-palette-results">
          {filtered.map((item) => { const Icon = item.icon; return <button type="button" key={item.path} onClick={() => { void navigate({ to: item.path }); setOpen(false) }}><span className="command-result-icon"><Icon size={17} /></span><span><strong>{item.label}</strong><small>{item.hint}</small></span><kbd>↵</kbd></button> })}
          {filtered.length === 0 && <p className="command-palette-empty">No matching commands found.</p>}
        </div>
        <footer><span>GUARDIANS OF THE GRID</span><span>↑ ↓ NAVIGATE · ENTER SELECT</span></footer>
      </section>
    </div>
  )
}
