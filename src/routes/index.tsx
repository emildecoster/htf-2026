import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, RadioTower, Users, BellRing } from 'lucide-react'

import { GlitchesTable } from '#/components/GlitchesTable.tsx'
import { AchronaMap } from '#/components/AchronaMap.tsx'
import { ThreatRadar } from '#/components/ThreatRadar.tsx'
import { MagicGauge } from '#/components/MagicGauge.tsx'
import { getGlitches } from '#/lib/glitches.functions.ts'
import { getCurrentGuardian } from '#/lib/auth/auth.functions.ts'
import { calculateMagic } from '#/lib/magic.ts'
import type { Glitch } from '#/lib/glitch.ts'
import type { Guardian } from '#/lib/guardian.ts'

type DashboardSnapshot = { glitches: Glitch[]; guardian: Guardian; savedAt: string }
const OFFLINE_CACHE_KEY = 'guardians-grid-dashboard-cache-v1'

export const Route = createFileRoute('/')({ component: OverviewPage })

function OverviewPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  // Keep the first render identical on the server and client.
  // The real network state is read in the effect after hydration.
  const [isOffline, setIsOffline] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    if (!navigator.onLine) { setIsOffline(true); return }
    setIsRefreshing(true)
    try {
      const [glitches, guardian] = await Promise.all([getGlitches(), getCurrentGuardian()])
      if (guardian) {
        const next = { glitches, guardian, savedAt: new Date().toISOString() }
        window.localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(next))
        setSnapshot(next)
      }
      setIsOffline(false)
    } catch {
      setIsOffline(true)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    // Read browser-only state after hydration to avoid SSR/client markup mismatch.
    setIsOffline(!navigator.onLine)
    const cached = window.localStorage.getItem(OFFLINE_CACHE_KEY)
    if (cached) {
      try { setSnapshot(JSON.parse(cached) as DashboardSnapshot) } catch { /* Ignore an invalid old cache. */ }
    }

    const handleOnline = () => { setIsOffline(false); void refresh() }
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    void refresh()
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refresh])

  const glitches = snapshot?.glitches ?? []
  const guardian = snapshot?.guardian ?? null
  if (!snapshot) {
    return <div className="dashboard mission-dashboard"><div className={`offline-status ${isOffline ? 'is-offline' : ''}`}><span />{isOffline ? 'OFFLINE — No saved mission data on this device yet.' : 'Connecting to Mission Control…'}</div></div>
  }
  const isCommander = guardian?.role === 'COMMANDER'
  const magic = calculateMagic(glitches)
  const activeGlitches = glitches.filter((glitch) => glitch.status !== 'FIXED').length
  const leakedGlitches = glitches.filter((glitch) => glitch.status === 'LEAKED')
  const leaked = leakedGlitches.length
  const assessing = glitches.filter((glitch) => glitch.status === 'ASSESSING').length
  const containing = glitches.filter((glitch) => glitch.status === 'CONTAINING').length
  const fixed = glitches.filter((glitch) => glitch.status === 'FIXED').length
  const assigned = glitches.filter((glitch) => glitch.assignedGuardianId !== null).length
  const unassigned = glitches.length - assigned

  const stats = [
    { label: 'LEAKED', value: leaked, icon: AlertTriangle, tone: 'red' },
    { label: 'ASSESSING', value: assessing, icon: Activity, tone: 'amber' },
    { label: 'CONTAINING', value: containing, icon: RadioTower, tone: 'cyan' },
    { label: 'FIXED', value: fixed, icon: CheckCircle2, tone: 'green' },
  ]

  return (
    <div className="dashboard mission-dashboard">
      <div className={`offline-status ${isOffline ? 'is-offline' : 'is-online'}`} role="status">
        <span />
        {isOffline ? 'OFFLINE MODE — Showing saved mission data. Changes are disabled.' : isRefreshing ? 'SYNCING — Updating mission data…' : 'ONLINE — Mission data is up to date.'}
        {isOffline && snapshot.savedAt ? <small>Last sync: {new Date(snapshot.savedAt).toLocaleString()}</small> : null}
      </div>
      <header className="mission-header">
        <div>
          <p className="dashboard-kicker"><span className="live-pulse" /> MISSION CONTROL / ACHRONA</p>
          <h1 className="dashboard-title">Grid <span>Command</span></h1>
          <p className="dashboard-subtitle">
            {guardian ? `Welcome back, ${guardian.codename}. ` : ''}
            Monitor anomalies and coordinate Guardian response.
          </p>
        </div>
        <div className="mission-identity">
          <div className="mission-avatar"><ShieldIcon /></div>
          <div><strong>{guardian?.codename ?? 'Guardian'}</strong><small>{guardian?.role ?? 'OPERATIVE'}</small></div>
          <span className="identity-online" />
        </div>
      </header>

      <section className="mission-stats" aria-label="Glitch status overview">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <article className={`mission-stat stat-${tone}`} key={label}>
            <div className="mission-stat-icon"><Icon size={21} /></div>
            <div><strong>{value.toString().padStart(2, '0')}</strong><span>{label}</span></div>
            <div className="mission-stat-scan" />
          </article>
        ))}
      </section>

      {leakedGlitches.length > 0 && (
        <section className="mission-alert-banner" role="alert" aria-live="assertive">
          <div className="mission-alert-icon"><BellRing size={21} /></div>
          <div className="mission-alert-copy">
            <span>ACTIVE THREAT / GUARDIAN RESPONSE REQUIRED</span>
            <strong>
              {leakedGlitches.length} LEAKED GLITCH{leakedGlitches.length === 1 ? '' : 'ES'} DETECTED
            </strong>
            <small>
              {leakedGlitches.map((glitch) => glitch.glitchId).join(' · ')} — Achrona is under threat. Resolve or contain every leaked Glitch.
            </small>
          </div>
          <span className="mission-alert-active">ACTIVE</span>
        </section>
      )}

      {!isOffline && <AchronaMap glitches={glitches} />}
      {!isOffline && <ThreatRadar glitches={glitches} />}

      <section className="mission-overview-grid">
        <div className="surface mission-gauge-surface">
          <div className="section-heading">
            <div><span className="section-kicker">CORE SYSTEM</span><h2>Magic stability</h2></div>
            <span className="system-chip"><span className="status-live-dot" /> LIVE</span>
          </div>
          {isOffline ? <p className="offline-feature-note">Live Magic Core paused while offline.</p> : <MagicGauge magic={magic} activeGlitches={activeGlitches} />}
        </div>
        <div className="mission-side-panel">
          <article className="surface mission-info-card">
            <div className="section-heading">
              <div><span className="section-kicker">DEPLOYMENT</span><h2>Guardian operations</h2></div>
              <Users size={20} />
            </div>
            <div className="deployment-number">{assigned}<small> / {glitches.length}</small></div>
            <p>Glitches currently assigned to a Guardian</p>
            <div className="deployment-track"><span style={{ width: `${glitches.length ? (assigned / glitches.length) * 100 : 0}%` }} /></div>
            <div className="deployment-footer"><span>{assigned} assigned</span><span>{unassigned} unassigned</span></div>
          </article>
          <article className="surface mission-briefing">
            <span className="section-kicker">COMMAND BRIEFING</span>
            <h2>{activeGlitches > 0 ? 'Threats detected across the grid' : 'Grid is stable'}</h2>
            <p>{activeGlitches > 0 ? `${activeGlitches} active Glitch${activeGlitches === 1 ? '' : 'es'} require monitoring. Review incident status and Guardian assignments below.` : 'No active Glitches are currently reported. Continue monitoring the network.'}</p>
            <div className="briefing-line"><span /> PRIORITY: {leaked > 0 ? 'HIGH' : activeGlitches > 0 ? 'MONITOR' : 'LOW'}</div>
          </article>
        </div>
      </section>

      <section className="surface mission-glitches-surface">
        <div className="mission-table-heading">
          <div className="section-heading">
            <div><span className="section-kicker">INCIDENT DATABASE</span><h2><Activity size={19} /> Glitch management</h2></div>
            <span className="table-count">{glitches.length} TOTAL</span>
          </div>
          <p>Track anomalies, update containment status and coordinate assignments.</p>
        </div>
        {isOffline ? (
          <div className="offline-glitch-list">
            {glitches.map((glitch) => <article key={glitch.glitchId}><strong>{glitch.glitchId}</strong><span>{glitch.status}</span><p>{glitch.description}</p><small>Assigned to: {glitch.assignedGuardianCodename ?? 'Unassigned'}</small></article>)}
          </div>
        ) : (
          <GlitchesTable glitches={glitches} isCommander={isCommander} currentGuardianId={guardian?.guardianId ?? null} onRefresh={refresh} />
        )}
      </section>
    </div>
  )
}

function ShieldIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 20 6v5.2c0 5.1-3.4 8.6-8 10.3-4.6-1.7-8-5.2-8-10.3V6l8-3.5Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>
}
