import { eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { guardians } from '#/db/schema.ts'

import {
  clearGuardianCookie,
  setGuardianCookie,
} from './session.server.ts'

export function login(data: { codename: string; password: string }) {
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
}

export function logout() {
  clearGuardianCookie()
  return { success: true }
}
