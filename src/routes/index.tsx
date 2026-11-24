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
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold text-fg">
        Welcome, {guardian.codename}
      </h1>

      <MagicGauge
        magic={magic}
        activeGlitches={activeGlitches}
      />

      <GlitchesTable glitches={glitches} />
    </div>
  )
}
