
import { createFileRoute } from '@tanstack/react-router'
import { GlitchesTable } from '#/components/GlitchesTable.tsx'
import { MagicGauge } from '#/components/MagicGauge.tsx'
import { getGlitches } from '#/lib/glitches.functions.ts'
import { calculateMagic } from '#/lib/magic.ts'

export const Route = createFileRoute('/')({
  loader: () => getGlitches(),
  component: OverviewPage,
})

function OverviewPage() {
  const glitches = Route.useLoaderData()

  const magic = calculateMagic(glitches)

  const activeGlitches = glitches.filter(
    (glitch) => glitch.status !== 'FIXED',
  ).length

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold text-fg">
        Overview
      </h1>

      <MagicGauge
        magic={magic}
        activeGlitches={activeGlitches}
      />

      <GlitchesTable glitches={glitches} />
    </div>
  )
}
