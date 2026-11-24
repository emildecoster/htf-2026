import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { echoes, glitches, guardians } from '#/db/schema.ts'
import { getGuardianCookie } from '#/lib/auth/session.server'
import { getAuthenticatedGuardian } from './auth/guardian.server'

export const createEcho = createServerFn({ method: 'POST' })
  .validator(
    (data: { description: string; glitchId?: string }) => ({
      description: data.description.trim(),
      glitchId: data.glitchId,
    }),
  )
  .handler(async ({ data }) => {
    const guardian = getAuthenticatedGuardian()

    if (!guardian) {
      throw new Error('You must be logged in to report an echo.')
    }

    if (!data.description) {
      throw new Error('Echo description cannot be empty.')
    }

    const timestamp = new Date().toISOString()
    const echoId = crypto.randomUUID()
    const glitchId = data.glitchId ?? crypto.randomUUID()

    return db.transaction((tx) => {
      if (data.glitchId) {
        const existingGlitch = tx
          .select()
          .from(glitches)
          .where(eq(glitches.glitchId, data.glitchId))
          .get()

        if (!existingGlitch) {
          throw new Error('The specified glitch does not exist.')
        }
      } else {
        tx.insert(glitches)
          .values({
            glitchId,
            status: 'LEAKED',
            description: data.description,
            timestamp,
          })
          .run()
      }

      tx.insert(echoes)
        .values({
          echoId,
          glitchId,
          reportingGuardianId: guardian.guardianId,
          description: data.description,
          timestamp,
        })
        .run()

      return { echoId, glitchId }
    })
  })
