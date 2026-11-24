import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { guardians } from '#/db/schema.ts'

import {
  clearGuardianCookie,
  setGuardianCookie,
} from '#/lib/auth/session.server'
import { getAuthenticatedGuardian } from './guardian.server'

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

export const getCurrentGuardian = createServerFn({ method: 'GET' }).handler(() => {
  return getAuthenticatedGuardian()
})
