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
    <div className="report-page">
      <div className="report-hero">
        <div className="report-hero-copy">
          <p className="report-kicker">ACHRONA DEFENSE NETWORK / FIELD REPORT</p>
          <h1>Report an <span>Echo</span></h1>
          <p>Transmit an anomaly observation to Mission Control. Your report will be logged and added to the active threat network.</p>
        </div>
        <div className="report-hero-orb" aria-hidden="true">
          <span className="report-orb-ring report-orb-ring-one" />
          <span className="report-orb-ring report-orb-ring-two" />
          <span className="report-orb-core"><span /></span>
        </div>
      </div>

      <div className="report-layout">
        <section className="report-form-panel">
          <div className="report-panel-heading">
            <span className="report-panel-icon">⌁</span>
            <div>
              <p>NEW FIELD TRANSMISSION</p>
              <h2>Echo details</h2>
            </div>
            <span className="report-live"><i /> SECURE</span>
          </div>
          <EchoForm
            onSuccess={({ glitchId }) => {
              navigate({
                to: '/glitches/$glitchId',
                params: { glitchId },
              })
            }}
          />
        </section>

        <aside className="report-side-panel">
          <p className="report-kicker">REPORTING PROTOCOL</p>
          <h3>Help protect Achrona.</h3>
          <ol>
            <li><span>01</span><div><strong>Observe</strong><small>Describe what you detected in the grid.</small></div></li>
            <li><span>02</span><div><strong>Transmit</strong><small>Send your Echo to Mission Control.</small></div></li>
            <li><span>03</span><div><strong>Respond</strong><small>Command will track the resulting Glitch.</small></div></li>
          </ol>
          <div className="report-side-status"><i /> ENCRYPTED CHANNEL ACTIVE</div>
        </aside>
      </div>
    </div>
  )
}
