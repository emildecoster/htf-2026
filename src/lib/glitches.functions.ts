
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { glitches, echoes } from '#/db/schema.ts'
import type { Glitch, GlitchStatus } from '#/lib/glitch.ts'
import { getCurrentGuardian } from '#/lib/auth/auth.functions.ts'

export const getGlitches = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Glitch[]> =>
    db.select().from(glitches).orderBy(desc(glitches.timestamp)).all(),
)

export const updateGlitchStatus = createServerFn({ method: 'POST' })
  .validator(
    (data: { glitchId: string; status: GlitchStatus }) => data,
  )
  .handler(async ({ data }) => {
    const guardian = await getCurrentGuardian()

    if (!guardian) {
      throw new Error('Unauthorized')
    }

    if (guardian.role !== 'COMMANDER') {
      throw new Error('Forbidden: Commander access required')
    }

    const validStatuses: readonly GlitchStatus[] = [
      'LEAKED',
      'ASSESSING',
      'CONTAINING',
      'FIXED',
    ]

    if (!validStatuses.includes(data.status)) {
      throw new Error('Invalid glitch status')
    }

    const result = db
      .update(glitches)
      .set({ status: data.status })
      .where(eq(glitches.glitchId, data.glitchId))
      .run()

    if (result.changes === 0) {
      throw new Error('Glitch not found')
    }

    return { success: true }
  })

// Delete a Glitch and all its associated Echoes.
export const deleteGlitch = createServerFn({ method: 'POST' })
  .validator((data: { glitchId: string }) => data)
  .handler(async ({ data }) => {
    const guardian = await getCurrentGuardian()

    if (!guardian) {
      throw new Error('Unauthorized')
    }

    if (guardian.role !== 'COMMANDER') {
      throw new Error('Forbidden: Commander access required')
    }

    const result = db.transaction((tx) => {
      // Echoes reference Glitches, so delete them first.
      tx.delete(echoes)
        .where(eq(echoes.glitchId, data.glitchId))
        .run()

      return tx.delete(glitches)
        .where(eq(glitches.glitchId, data.glitchId))
        .run()
    })

    if (result.changes === 0) {
      throw new Error('Glitch not found')
    }

    return { success: true }
  })
