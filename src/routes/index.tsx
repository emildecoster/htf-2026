import { createFileRoute } from '@tanstack/react-router'

import { GlitchesTable } from '#/components/GlitchesTable.tsx'
import { MagicGauge } from '#/components/MagicGauge.tsx'
import { getGlitches } from '#/lib/glitches.functions.ts'
import { getCurrentGuardian } from '#/lib/auth/auth.functions.ts'
import { calculateMagic } from '#/lib/magic.ts'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [glitches, guardian] = await Promise.all([
      getGlitches(),
      getCurrentGuardian(),
    ])

    return { glitches, guardian }
  },
  component: OverviewPage,
})

function OverviewPage() {
  const { glitches, guardian } = Route.useLoaderData()

  const isCommander = guardian?.role === 'COMMANDER'

  const magic = calculateMagic(glitches)

  const activeGlitches = glitches.filter(
    (glitch) => glitch.status !== 'FIXED',
  ).length

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold text-fg">
          Overview
        </h1>

        {!isCommander && guardian && (
          <p className="mt-2 text-sm text-muted">
            Welcome, {guardian.codename}. You can view all Glitches and manage the ones assigned to you.
          </p>
        )}
      </div>

      <MagicGauge
        magic={magic}
        activeGlitches={activeGlitches}
      />

      <GlitchesTable
        glitches={glitches}
        isCommander={isCommander}
        currentGuardianId={guardian?.guardianId ?? null}
      />
    </div>
  )
}
