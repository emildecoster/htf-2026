type MagicGaugeProps = {
  magic: number
  activeGlitches: number
}

export function MagicGauge({ magic, activeGlitches }: MagicGaugeProps) {
  const status = magic >= 75 ? 'STABLE' : magic >= 40 ? 'UNSTABLE' : 'CRITICAL'
  const color = magic >= 75 ? '#42e6c1' : magic >= 40 ? '#f6bd60' : '#ff647c'

  return (
    <div className="magic-core">
      <div className="magic-core-ring" style={{ '--magic-value': `${magic}%`, '--magic-color': color } as React.CSSProperties}>
        <div className="magic-core-inner">
          <span className="magic-core-energy energy-one" />
          <span className="magic-core-energy energy-two" />
          <span className="magic-core-label">ACHRONA CORE</span>
          <strong>{magic}<small>%</small></strong>
          <span className="magic-core-state" style={{ color }}>{status}</span>
        </div>
      </div>
      <div className="magic-core-caption">
        <span className="magic-core-live"><i /> CORE REACTOR ONLINE</span>
        <span className="magic-core-orbit" />
        <p><strong>{activeGlitches}</strong> active {activeGlitches === 1 ? 'Glitch' : 'Glitches'} affecting grid stability</p>
        <small>ENERGY RESERVE / REAL-TIME MONITORING</small>
      </div>
    </div>
  )
}
