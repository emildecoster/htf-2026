import {
  createFileRoute,
  Link,
  notFound,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { RadioTower, X } from 'lucide-react'

import { EchoForm } from '#/components/EchoForm.tsx'
import { getCurrentGuardian } from '#/lib/auth/auth.functions.ts'
import { getGlitch } from '#/lib/glitches.functions.ts'
import { AuthenticatedImage } from '#/components/ui/AuthenticatedImage'

export const Route = createFileRoute('/glitches/$glitchId')({
  beforeLoad: async () => {
    const guardian = await getCurrentGuardian()

    if (!guardian) {
      throw redirect({ to: '/login' })
    }
  },

  loader: async ({ params }) => {
    const glitch = await getGlitch({
      data: { glitchId: params.glitchId },
    })

    if (!glitch) {
      throw notFound()
    }

    return { glitch }
  },

  component: GlitchPage,
})

function GlitchPage() {
  const { glitch } = Route.useLoaderData()
  const router = useRouter()

  const echoDialogRef = useRef<HTMLDialogElement>(null)
  const imageDialogRef = useRef<HTMLDialogElement>(null)

  const [selectedImage, setSelectedImage] = useState<{
    attachmentId: string
    fileName: string
  } | null>(null)

  function openImage(attachment: {
    attachmentId: string
    fileName: string
  }) {
    setSelectedImage(attachment)
    imageDialogRef.current?.showModal()
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Glitch header */}
      <header className="flex flex-col gap-3">
        <Link
          to="/"
          className="mb-4 w-fit text-sm text-muted transition-colors hover:text-fg"
        >
          ← Back to overview
        </Link>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wider text-muted">
              GLITCH DETAILS
            </span>

            <h1 className="text-3xl font-semibold text-fg">
              {glitch.glitchId}
            </h1>

            <time
              dateTime={glitch.timestamp}
              className="text-sm text-muted"
            >
              Reported {new Date(glitch.timestamp).toLocaleString()}
            </time>
          </div>

          <span className="rounded-full bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
            {glitch.status}
          </span>
        </div>
      </header>

      {/* Glitch description */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-fg">
          Description
        </h2>

        <div className="rounded-xl border border-line bg-card p-5">
          <p className="leading-relaxed text-fg">
            {glitch.description}
          </p>
        </div>
      </section>

      {/* Echo timeline */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-fg">
            Echoes ({glitch.echoes.length})
          </h2>

          <button
            type="button"
            onClick={() => echoDialogRef.current?.showModal()}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 hover:cursor-pointer"
          >
            <RadioTower size={17} strokeWidth={1.8} />
            Report Echo
          </button>
        </div>

        {glitch.echoes.length === 0 ? (
          <p className="rounded-lg border border-line p-5 text-sm text-muted">
            No echoes have been reported for this glitch yet.
          </p>
        ) : (
          <div className="flex flex-col">
            {glitch.echoes.map((echo, index) => (
              <article
                key={echo.echoId}
                className="relative pb-7 last:pb-0"
              >
                {/* Timeline connector */}
                {index !== glitch.echoes.length - 1 && (
                  <div className="absolute bottom-0 left-[5px] top-3 w-px bg-line" />
                )}

                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 size-[11px] rounded-full border-2 border-accent bg-panel" />

                {/* Echo content */}
                <div className="ml-7 flex flex-col gap-3">
                  <p className="text-base leading-relaxed text-fg">
                    {echo.description}
                  </p>

                  {/* Image attachments */}
                  {echo.attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {echo.attachments.map((attachment) => (
                        <button
                          key={attachment.attachmentId}
                          type="button"
                          onClick={() => openImage(attachment)}
                          aria-label={`View image: ${attachment.fileName}`}
                          className="group overflow-hidden rounded-lg border border-line bg-card text-left hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
                        >
                          <AuthenticatedImage
                            attachmentId={attachment.attachmentId}
                            alt={attachment.fileName}
                            className="aspect-video w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted">
                      Reported by {echo.reportingGuardian}
                    </span>

                    <time
                      dateTime={echo.timestamp}
                      className="text-xs text-muted"
                    >
                      {new Date(echo.timestamp).toLocaleString()}
                    </time>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Report echo dialog */}
      <dialog
        ref={echoDialogRef}
        aria-labelledby="echo-dialog-title"
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-line bg-panel p-0 text-fg shadow-2xl backdrop:bg-black/60"
      >
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2
                id="echo-dialog-title"
                className="text-xl font-semibold"
              >
                Report an Echo
              </h2>

              <p className="text-sm text-muted">
                Submit a new observation for {glitch.glitchId}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => echoDialogRef.current?.close()}
              aria-label="Close dialog"
              className="rounded-lg p-2 text-muted transition-colors hover:bg-subtle hover:text-fg hover:cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="border-t border-line pt-5">
            <EchoForm
              glitchId={glitch.glitchId}
              onSuccess={() => {
                echoDialogRef.current?.close()
                void router.invalidate()
              }}
            />
          </div>
        </div>
      </dialog>

      {/* Image preview dialog */}
      <dialog
        ref={imageDialogRef}
        aria-label="Image preview"
        className="m-auto w-[calc(100%-2rem)] max-w-4xl rounded-xl border border-line bg-panel p-3 text-fg shadow-2xl backdrop:bg-black/80"
      >
        <div className="flex items-center justify-between gap-4 pb-3">
          <p className="truncate text-sm font-medium text-fg">
            {selectedImage?.fileName}
          </p>

          <button
            type="button"
            onClick={() => imageDialogRef.current?.close()}
            aria-label="Close image preview"
            className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-subtle hover:text-fg hover:cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {selectedImage && (
          <AuthenticatedImage
            attachmentId={selectedImage.attachmentId}
            alt={selectedImage.fileName}
            className="mx-auto max-h-[75vh] max-w-full rounded-lg object-contain"
          />
        )}
      </dialog>
    </div>
  )
}
