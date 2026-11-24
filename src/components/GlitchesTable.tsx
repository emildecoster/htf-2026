
import { EllipsisVertical } from 'lucide-react'
import { IconButton } from '#/components/ui/IconButton.tsx'
import type { Glitch } from '#/lib/glitch.ts'

const columns = ['ID', 'Description', 'Status', 'Timestamp', 'Action']

const statusStyles: Record<Glitch['status'], string> = {
  LEAKED: 'status-leaked',
  ASSESSING: 'status-assessing',
  CONTAINING: 'status-containing',
  FIXED: 'status-fixed',
}

const timestampFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function GlitchesTable({ glitches }: { glitches: Glitch[] }) {
  return (
    <section className="surface table-panel">
      <header className="table-heading"><h2>Recent glitches</h2><span className="table-count">{glitches.length} signals</span></header>
      <div className="table-scroll">
        <table className="glitch-table">
          <thead>
            <tr className="border-b-2 border-line text-muted">
              {columns.map((col, i) => (
                <th
                  key={col}
                  className={`px-5 py-4 font-normal ${
                    i === columns.length - 1 ? 'text-center' : ''
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="text-fg">
            {glitches.map((glitch) => (
              <tr
                key={glitch.glitchId}
                className="border-b border-line transition-colors hover:bg-surface-hover"
              >
                <td className="glitch-id">
                  {glitch.glitchId}
                </td>

                <td className="glitch-description">
                  {glitch.description}
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  <span
                    className={`status-pill ${
                      statusStyles[glitch.status]
                    }`}
                  >
                    {glitch.status}
                  </span>
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  <time
                    dateTime={glitch.timestamp}
                    suppressHydrationWarning
                  >
                    {timestampFormat.format(
                      new Date(glitch.timestamp),
                    )}
                  </time>
                </td>

                <td className="text-center">
                  <IconButton className="row-action" aria-label={`${glitch.glitchId} actions`}>
                    <EllipsisVertical className="size-5" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
