import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { echoAttachments, echoes, glitches } from '#/db/schema.ts'
import { getAuthenticatedGuardian } from './auth/guardian.server'
import {
  deleteStoredImage,
  storeImage,
  type StoredImage,
} from './attachments/attachments.server.ts'

const MAX_IMAGES = 5

function generateGlitchId(): string {
  const number = Math.floor(Math.random() * 9000) + 1000
  return `GL-${number}`
}

export const createEcho = createServerFn({ method: 'POST' })
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected FormData.')
    }

    return data
  })
  .handler(async ({ data }) => {
    const guardian = getAuthenticatedGuardian()

    if (!guardian) {
      throw new Error('You must be logged in to report an echo.')
    }

    // Validate description.
    const descriptionValue = data.get('description')

    if (typeof descriptionValue !== 'string') {
      throw new Error('A description is required.')
    }

    const description = descriptionValue.trim()

    if (!description) {
      throw new Error('Echo description cannot be empty.')
    }

    // Validate optional glitch ID.
    const glitchIdValue = data.get('glitchId')

    if (glitchIdValue !== null && typeof glitchIdValue !== 'string') {
      throw new Error('Invalid glitch ID.')
    }

    const requestedGlitchId = glitchIdValue?.trim() || undefined

    // Extract uploaded images.
    const imageEntries = data.getAll('images')

    if (imageEntries.some((entry) => !(entry instanceof File))) {
      throw new Error('Invalid image attachment.')
    }

    const images = imageEntries as File[]

    if (images.length > MAX_IMAGES) {
      throw new Error(`You can attach a maximum of ${MAX_IMAGES} images.`)
    }

    const timestamp = new Date().toISOString()
    const echoId = crypto.randomUUID()
    const glitchId = requestedGlitchId ?? generateGlitchId()

    const storedImages: StoredImage[] = []

    try {
      // Store files before opening the database transaction.
      for (const image of images) {
        storedImages.push(await storeImage(image))
      }

      // Create the Echo and its attachment records atomically.
      return db.transaction((tx) => {
        if (requestedGlitchId) {
          const existingGlitch = tx
            .select()
            .from(glitches)
            .where(eq(glitches.glitchId, requestedGlitchId))
            .get()

          if (!existingGlitch) {
            throw new Error('The specified glitch does not exist.')
          }
        } else {
          tx.insert(glitches)
            .values({
              glitchId,
              status: 'LEAKED',
              description,
              timestamp,
            })
            .run()
        }

        tx.insert(echoes)
          .values({
            echoId,
            glitchId,
            reportingGuardianId: guardian.guardianId,
            description,
            timestamp,
          })
          .run()

        for (const image of storedImages) {
          tx.insert(echoAttachments)
            .values({
              attachmentId: crypto.randomUUID(),
              echoId,
              fileName: image.fileName,
              filePath: image.filePath,
              mimeType: image.mimeType,
              timestamp,
            })
            .run()
        }

        return { echoId, glitchId }
      })
    } catch (error) {
      // The database operation failed, or an upload was unsuccessful.
      // Remove any files that were already written.
      const cleanupResults = await Promise.allSettled(
        storedImages.map((image) => deleteStoredImage(image.filePath)),
      )

      for (const result of cleanupResults) {
        if (result.status === 'rejected') {
          console.error('Failed to clean up uploaded image:', result.reason)
        }
      }

      throw error
    }
  })
