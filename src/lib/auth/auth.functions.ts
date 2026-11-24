import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { guardians } from '#/db/schema.ts'

import {
  clearGuardianCookie,
  getGuardianCookie,
  setGuardianCookie,
} from '#/lib/auth/session.ts'

export const login = createServerFn({ method: 'POST' })
  .validator((data: { codename: string; password: string }) => data)
  .handler(async ({ data }) => {
    const guardian = db
      .select()
      .from(guardians)
      .where(eq(guardians.codename, data.codename))
      .get()

    if (!guardian || guardian.password !== data.password) {
      return { success: false }
    }

    setGuardianCookie(guardian.guardianId)

    return { success: true }
  })

export const logout = createServerFn({ method: 'POST' }).handler(() => {
  clearGuardianCookie()
  return { success: true }
})

export const getCurrentGuardian = createServerFn({ method: 'GET' }).handler(
  async () => {
    const guardianId = getGuardianCookie()

    if (!guardianId) {
      return null
    }

    const guardian = db
      .select({
        guardianId: guardians.guardianId,
        codename: guardians.codename,
        role: guardians.role,
      })
      .from(guardians)
      .where(eq(guardians.guardianId, guardianId))
      .get()

    return guardian ?? null
  },
)
