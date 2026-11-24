
type MagicGaugeProps = {
  magic: number
  activeGlitches: number
}

export function MagicGauge({
  magic,
  activeGlitches,
}: MagicGaugeProps) {
  const status =
    magic >= 75
      ? 'STABLE'
      : magic >= 40
        ? 'UNSTABLE'
        : 'CRITICAL'

  const color =
    magic >= 75
      ? '#22c55e'
      : magic >= 40
        ? '#eab308'
        : '#ef4444'

  return (
    <div className="rounded-xl border border-gray-700 p-6">
      <h2 className="mb-6 text-xl font-semibold text-fg">
        Achrona Magic Stability
      </h2>

      <div className="flex flex-col items-center gap-4">
        <div
          className="relative flex h-48 w-48 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(
              ${color} ${magic}%,
              #374151 ${magic}%
            )`,
          }}
        >
          <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-gray-900">
            <span className="text-4xl font-bold text-white">
              {magic}%
            </span>
            <span
              className="mt-2 text-sm font-semibold"
              style={{ color }}
            >
              {status}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-400">
          {activeGlitches} active glitches
        </p>
      </div>
    </div>
  )
}
