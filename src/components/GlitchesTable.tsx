
import { EllipsisVertical } from 'lucide-react'
import { IconButton } from '#/components/ui/IconButton.tsx'
import type { Glitch } from '#/lib/glitch.ts'

const columns = ['ID', 'Description', 'Status', 'Timestamp', 'Action']

const statusStyles: Record<Glitch['status'], string> = {
  LEAKED: 'bg-red-500/10 text-red-500 border-red-500/20',
  ASSESSING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  CONTAINING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  FIXED: 'bg-green-500/10 text-green-500 border-green-500/20',
}

const timestampFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function GlitchesTable({ glitches }: { glitches: Glitch[] }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
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
                <td className="px-5 py-4 whitespace-nowrap">
                  {glitch.glitchId}
                </td>

                <td className="px-5 py-4">
                  {glitch.description}
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
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

                <td className="px-5 py-4 text-center">
                  <IconButton aria-label={`${glitch.glitchId} actions`}>
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
