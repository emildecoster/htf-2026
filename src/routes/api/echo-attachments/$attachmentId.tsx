import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { echoAttachments } from '#/db/schema.ts'
import { getAuthenticatedGuardian } from '#/lib/auth/guardian.server.ts'
import { readStoredImage } from '#/lib/attachments/attachments.server.ts'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const Route = createFileRoute(
  '/api/echo-attachments/$attachmentId',
)({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        console.log('Image request:', {
          attachmentId: params.attachmentId,
          destination: request.headers.get('sec-fetch-dest'),
          accept: request.headers.get('accept'),
        })

        // Authentication
        const guardian = getAuthenticatedGuardian()

        if (!guardian) {
          return new Response('Unauthorized', { status: 401 })
        }

        // Retrieve attachment metadata
        const attachment = db
          .select()
          .from(echoAttachments)
          .where(eq(echoAttachments.attachmentId, params.attachmentId))
          .get()

        if (!attachment) {
          return new Response('Attachment not found', { status: 404 })
        }

        // Validate the stored MIME type
        if (
          !ALLOWED_MIME_TYPES.includes(
            attachment.mimeType as (typeof ALLOWED_MIME_TYPES)[number],
          )
        ) {
          return new Response('Unsupported image type', { status: 415 })
        }

        try {
          const image = await readStoredImage(attachment.filePath)

          return new Response(new Uint8Array(image), {
            headers: {
              'Content-Type': attachment.mimeType,
              'Content-Length': image.length.toString(),
              'Content-Disposition': 'inline',
              'Cache-Control': 'private, no-store',
              'X-Content-Type-Options': 'nosniff',
            },
          })
        } catch (error) {
          console.error('Failed to read attachment:', error)

          return new Response('Unable to retrieve attachment', {
            status: 500,
          })
        }
      },
    },
  },
})
