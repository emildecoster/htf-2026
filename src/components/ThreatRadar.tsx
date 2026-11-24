import { useMemo } from 'react'
import { Radar, RadioTower } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Glitch } from '#/lib/glitch.ts'

type Props = { glitches: Glitch[] }
type RadarPoint = { glitch: Glitch; x: number; y: number }

const colors: Record<Glitch['status'], string> = {
  LEAKED: '#fb5268',
  ASSESSING: '#f7bd4b',
  CONTAINING: '#36c9ff',
  FIXED: '#42df9a',
}

function positionFromId(id: string) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180)
  const radius = 18 + (Math.abs(hash >>> 4) % 29)
  return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius }
}

export function ThreatRadar({ glitches }: Props) {
  const active = useMemo(() => glitches.filter((glitch) => glitch.status !== 'FIXED'), [glitches])
  const points: RadarPoint[] = useMemo(
    () => active.map((glitch) => ({ glitch, ...positionFromId(glitch.glitchId) })),
    [active],
  )

  return (
    <section className="surface threat-radar-panel">
      <div className="section-heading">
        <div><span className="section-kicker">LONG-RANGE SCAN / GRID FREQUENCY 04</span><h2><Radar size={19} /> Live threat radar</h2></div>
        <span className="system-chip"><span className="status-live-dot" /> SCANNING</span>
      </div>
      <div className="threat-radar-layout">
        <div className="threat-radar-screen" aria-label={`${active.length} active Glitches detected on radar`}>
          <div className="radar-grid-circle radar-grid-one" />
          <div className="radar-grid-circle radar-grid-two" />
          <div className="radar-grid-circle radar-grid-three" />
          <div className="radar-crosshair radar-crosshair-x" />
          <div className="radar-crosshair radar-crosshair-y" />
          <div className="radar-sweep" />
          <div className="radar-center"><RadioTower size={17} /></div>
          {points.map(({ glitch, x, y }) => (
            <span key={glitch.glitchId} className="radar-blip" title={`${glitch.glitchId} · ${glitch.status}`} style={{ left: `${x}%`, top: `${y}%`, '--blip-color': colors[glitch.status] } as CSSProperties} />
          ))}
          {active.length === 0 && <span className="radar-clear-label">NO ACTIVE SIGNALS</span>}
        </div>
        <div className="radar-readout">
          <div><span>DETECTED SIGNALS</span><strong>{active.length.toString().padStart(2, '0')}</strong></div>
          <div><span>CRITICAL / LEAKED</span><strong className="radar-red">{active.filter((g) => g.status === 'LEAKED').length.toString().padStart(2, '0')}</strong></div>
          <div><span>CONTAINMENT</span><strong className="radar-cyan">{active.filter((g) => g.status === 'CONTAINING').length.toString().padStart(2, '0')}</strong></div>
          <p>Signal positions are generated consistently from each Glitch ID. Fixed incidents are removed from the scan.</p>
        </div>
      </div>
    </section>
  )
}
