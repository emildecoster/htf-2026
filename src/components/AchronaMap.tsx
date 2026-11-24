import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { MapPinned, RadioTower, X } from 'lucide-react'
import type { Glitch } from '#/lib/glitch.ts'

type Props = { glitches: Glitch[] }
type MapPoint = { glitch: Glitch; x: number; y: number }

const statusColors: Record<Glitch['status'], string> = {
  LEAKED: '#fb5268',
  ASSESSING: '#f7bd4b',
  CONTAINING: '#36c9ff',
  FIXED: '#42df9a',
}

// A deterministic hash gives each Glitch a stable position across reloads
// without adding location columns or requiring a database migration.
function stablePosition(id: string) {
  let hash = 2166136261
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  const unsigned = hash >>> 0
  const x = 10 + (unsigned % 8000) / 100
  const y = 12 + ((Math.imul(unsigned, 2654435761) >>> 0) % 7600) / 100
  return { x: Math.min(x, 90), y: Math.min(y, 88) }
}

export function AchronaMap({ glitches }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeGlitches = useMemo(
    () => glitches.filter((glitch) => glitch.status !== 'FIXED'),
    [glitches],
  )
  const points: MapPoint[] = useMemo(
    () => activeGlitches.map((glitch) => ({ ...stablePosition(glitch.glitchId), glitch })),
    [activeGlitches],
  )
  const selected = activeGlitches.find((glitch) => glitch.glitchId === selectedId) ?? null

  return (
    <section className="surface achrona-map-panel">
      <div className="achrona-map-heading">
        <div>
          <span className="section-kicker">TACTICAL HOLOGRAM / ACHRONA SECTOR 01</span>
          <h2><MapPinned size={19} /> Grid anomaly map</h2>
          <p>Active Glitches are plotted automatically. Fixed incidents disappear from the map.</p>
        </div>
        <div className="achrona-map-total"><RadioTower size={15} /> {activeGlitches.length} ACTIVE</div>
      </div>

      <div className="achrona-map-canvas">
        <svg className="achrona-map-art" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="achrona-grid" width="34" height="34" patternUnits="userSpaceOnUse">
              <path d="M 34 0 L 0 0 0 34" fill="none" stroke="#1b6689" strokeWidth="0.8" opacity=".48" />
            </pattern>
            <radialGradient id="achrona-core">
              <stop offset="0" stopColor="#1acbff" stopOpacity=".27" />
              <stop offset="1" stopColor="#071a2b" stopOpacity="0" />
            </radialGradient>
            <filter id="achrona-glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <rect width="1000" height="560" fill="#071827" />
          <rect width="1000" height="560" fill="url(#achrona-grid)" />
          <ellipse cx="510" cy="280" rx="410" ry="290" fill="url(#achrona-core)" />
          <g fill="none" stroke="#1b789f" strokeWidth="3" opacity=".48">
            <path d="M-30 120 170 120 245 190 440 190 520 95 770 95 880 180 1030 180" />
            <path d="M-20 420 170 420 260 340 430 340 520 450 720 450 820 360 1030 360" />
            <path d="M180 -20 180 110 300 230 300 330 180 470 180 590" />
            <path d="M820 -20 820 130 700 250 700 360 830 490 830 590" />
            <path d="M450 -20 450 120 540 210 540 340 450 430 450 590" />
          </g>
          <g fill="none" stroke="#35caff" strokeWidth="1.4" opacity=".45">
            <path d="M70 270h860M500 35v490M100 80l800 400M100 480 900 80" strokeDasharray="5 9" />
            <path d="M90 280c0-145 180-245 410-245s410 100 410 245-180 245-410 245S90 425 90 280Z" />
            <path d="M210 280c0-100 130-175 290-175s290 75 290 175-130 175-290 175-290-75-290-175Z" />
          </g>
          <g fill="#1c8bb2" opacity=".24">
            <path d="m110 160 75-50 85 32-20 88-90 35-65-45Z" />
            <path d="m360 75 105-30 65 55-35 90-105-10-45-55Z" />
            <path d="m650 155 110-40 90 70-30 100-125 5-65-65Z" />
            <path d="m340 370 100-45 85 65-35 100-110 5-65-65Z" />
            <path d="m650 370 95-35 100 55-25 95-115 5-65-65Z" />
          </g>
          <g fill="#74e5ff" fontSize="13" fontFamily="monospace" opacity=".65">
            <text x="45" y="48">NORTH GRID</text><text x="790" y="45">SECTOR 07</text>
            <text x="45" y="530">ACHRONA // NETWORK MAP</text><text x="840" y="530">GRID 04-B</text>
          </g>
          <circle cx="500" cy="280" r="9" fill="#52ddff" filter="url(#achrona-glow)" />
          <circle cx="500" cy="280" r="24" fill="none" stroke="#52ddff" opacity=".7" />
          <circle cx="500" cy="280" r="42" fill="none" stroke="#52ddff" strokeDasharray="3 8" opacity=".5" />
        </svg>

        {points.map(({ glitch, x, y }) => (
          <button
            key={glitch.glitchId}
            type="button"
            className={`achrona-map-marker ${selectedId === glitch.glitchId ? 'is-selected' : ''}`}
            style={{ left: `${x}%`, top: `${y}%`, '--marker-color': statusColors[glitch.status] } as CSSProperties}
            onClick={() => setSelectedId((current) => current === glitch.glitchId ? null : glitch.glitchId)}
            aria-label={`${glitch.glitchId}, ${glitch.status}, ${glitch.assignedGuardianCodename ?? 'Unassigned'}`}
            title={`${glitch.glitchId} · ${glitch.status}`}
          >
            <span className="marker-pulse" />
            <span className="marker-core" />
            <span className="marker-label">{glitch.glitchId}</span>
          </button>
        ))}

        {selected && (
          <div className="achrona-map-popup">
            <button type="button" className="map-popup-close" onClick={() => setSelectedId(null)} aria-label="Close Glitch details"><X size={15} /></button>
            <span className="section-kicker">ANOMALY IDENTIFIED</span>
            <strong>{selected.glitchId}</strong>
            <span className="map-popup-description">{selected.description}</span>
            <span className="map-popup-status" style={{ color: statusColors[selected.status] }}>{selected.status}</span>
            <span className="map-popup-guardian">Assigned to: {selected.assignedGuardianCodename ?? 'Unassigned'}</span>
          </div>
        )}

        {activeGlitches.length === 0 && (
          <div className="achrona-map-empty"><MapPinned size={25} /><strong>Grid is clear</strong><span>No active Glitches detected in Achrona.</span></div>
        )}
        <div className="achrona-map-coordinates">LIVE GRID SIMULATION <span>●</span> AUTO-PLOTTING</div>
      </div>

      <div className="achrona-map-legend">
        {(['LEAKED', 'ASSESSING', 'CONTAINING'] as const).map((status) => (
          <span key={status}><i style={{ background: statusColors[status] }} />{status}</span>
        ))}
        <span className="map-legend-note">FIXED GLITCHES HIDDEN</span>
      </div>
    </section>
  )
}
