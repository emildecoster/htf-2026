import { createFileRoute, redirect } from '@tanstack/react-router'
import { GlitchesTable } from '#/components/GlitchesTable.tsx'
import { MagicGauge } from '#/components/MagicGauge.tsx'
import { getGlitches } from '#/lib/glitches.functions.ts'
import { calculateMagic } from '#/lib/magic.ts'
import { getCurrentGuardian } from '#/lib/auth/auth.functions'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const guardian = await getCurrentGuardian()

    if (!guardian) {
      throw redirect({ to: '/login' })
    }

    return { guardian }
  },
  loader: () => getGlitches(),
  component: OverviewPage,
})

function OverviewPage() {
  const glitches = Route.useLoaderData()
  const { guardian } = Route.useRouteContext()

  const magic = calculateMagic(glitches)

  const activeGlitches = glitches.filter(
    (glitch) => glitch.status !== 'FIXED',
  ).length

  return (
    <div className="dashboard">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-kicker">Guardian network / Achrona</p>
          <h1 className="dashboard-title">Welcome, <span>{guardian.codename}</span></h1>
          <p className="dashboard-subtitle">Here is the current state of the grid.</p>
        </div>
      </header>

      <MagicGauge
        magic={magic}
        activeGlitches={activeGlitches}
      />

      <GlitchesTable glitches={glitches} />
    </div>
  )
}
