import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { EchoForm } from '#/components/EchoForm.tsx'
import { getCurrentGuardian } from '#/lib/auth/auth.functions.ts'

export const Route = createFileRoute('/report-echo')({
  beforeLoad: async () => {
    const guardian = await getCurrentGuardian()

    if (!guardian) {
      throw redirect({ to: '/login' })
    }
  },
  component: ReportEchoPage,
})

function ReportEchoPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-fg">
          Report an Echo
        </h1>

        <p className="text-muted">
          Report an anomaly you've observed. A new glitch will automatically
          be registered in the system.
        </p>
      </div>

      <EchoForm
        onSuccess={({ glitchId }) => {
          navigate({
            to: '/glitches/$glitchId',
            params: { glitchId },
          })
        }}
      />
    </div>
  )
}
