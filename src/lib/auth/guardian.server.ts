import { eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { guardians } from '#/db/schema.ts'
import type { Guardian } from '#/lib/guardian.ts'
import { getGuardianCookie } from './session.server.ts'

export function getAuthenticatedGuardian(): Guardian | null {
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
}
