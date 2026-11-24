
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { glitches, echoes, guardians } from '#/db/schema.ts'
import type { Glitch, GlitchStatus } from '#/lib/glitch.ts'
import { getCurrentGuardian } from '#/lib/auth/auth.functions.ts'

// Get all Glitches for both Commanders and Defenders.
export const getGlitches = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Glitch[]> => {
    const guardian = await getCurrentGuardian()

    if (!guardian) {
      throw new Error('Unauthorized')
    }

    return db
      .select()
      .from(glitches)
      .orderBy(desc(glitches.timestamp))
      .all()
  },
)

// Get all Defenders (Commander only).
export const getDefenders = createServerFn({ method: 'GET' }).handler(
  async () => {
    const guardian = await getCurrentGuardian()

    if (!guardian) {
      throw new Error('Unauthorized')
    }

    if (guardian.role !== 'COMMANDER') {
      throw new Error('Forbidden: Commander access required')
    }

    return db
      .select({
        guardianId: guardians.guardianId,
        codename: guardians.codename,
      })
      .from(guardians)
      .where(eq(guardians.role, 'DEFENDER'))
      .all()
  },
)

// Assign, reassign or unassign a Defender (Commander only).
export const assignGlitch = createServerFn({ method: 'POST' })
  .validator(
    (data: { glitchId: string; guardianId: string | null }) => data,
  )
  .handler(async ({ data }) => {
    const guardian = await getCurrentGuardian()

    if (!guardian) {
      throw new Error('Unauthorized')
    }

    if (guardian.role !== 'COMMANDER') {
      throw new Error('Forbidden: Commander access required')
    }

    // Verify that the selected Guardian exists and is a Defender.
    if (data.guardianId !== null) {
      const defender = db
        .select()
        .from(guardians)
        .where(eq(guardians.guardianId, data.guardianId))
        .get()

      if (!defender || defender.role !== 'DEFENDER') {
        throw new Error('Invalid Defender')
      }
    }

    const result = db
      .update(glitches)
      .set({ assignedGuardianId: data.guardianId })
      .where(eq(glitches.glitchId, data.glitchId))
      .run()

    if (result.changes === 0) {
      throw new Error('Glitch not found')
    }

    return { success: true }
  })

// Update Glitch status.
// Commanders can update every Glitch.
// Defenders can update only Glitches assigned to them.
export const updateGlitchStatus = createServerFn({ method: 'POST' })
  .validator(
    (data: { glitchId: string; status: GlitchStatus }) => data,
  )
  .handler(async ({ data }) => {
    const guardian = await getCurrentGuardian()

    if (!guardian) {
      throw new Error('Unauthorized')
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

    // Find the Glitch.
    const glitch = db
      .select()
      .from(glitches)
      .where(eq(glitches.glitchId, data.glitchId))
      .get()

    if (!glitch) {
      throw new Error('Glitch not found')
    }

    // Defenders can only update their own assigned Glitches.
    if (
      guardian.role === 'DEFENDER' &&
      glitch.assignedGuardianId !== guardian.guardianId
    ) {
      throw new Error('Forbidden: This Glitch is not assigned to you')
    }

    // Only Commanders and Defenders are allowed.
    if (
      guardian.role !== 'COMMANDER' &&
      guardian.role !== 'DEFENDER'
    ) {
      throw new Error('Forbidden')
    }

    db.update(glitches)
      .set({ status: data.status })
      .where(eq(glitches.glitchId, data.glitchId))
      .run()

    return { success: true }
  })

// Delete a Glitch and all its associated Echoes (Commander only).
export const deleteGlitch = createServerFn({ method: 'POST' })
  .validator(
    (data: { glitchId: string }) => data,
  )
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

export const getGlitch = createServerFn({ method: 'GET' })
  .validator((data: { glitchId: string }) => data)
  .handler(({ data }) => {
    const glitch = db
      .select()
      .from(glitches)
      .where(eq(glitches.glitchId, data.glitchId))
      .get()

    if (!glitch) {
      return null
    }

    const glitchEchoes = db
      .select({
        echoId: echoes.echoId,
        description: echoes.description,
        timestamp: echoes.timestamp,
        reportingGuardian: guardians.codename,
      })
      .from(echoes)
      .innerJoin(
        guardians,
        eq(echoes.reportingGuardianId, guardians.guardianId),
      )
      .where(eq(echoes.glitchId, data.glitchId))
      .orderBy(desc(echoes.timestamp))
      .all()

    return {
      ...glitch,
      echoes: glitchEchoes,
    }
  })
