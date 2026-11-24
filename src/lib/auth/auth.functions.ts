import { createServerFn } from '@tanstack/react-start'

import {
  login as loginGuardian,
  logout as logoutGuardian,
} from './auth.server.ts'
import { getAuthenticatedGuardian } from './guardian.server.ts'

export const login = createServerFn({ method: 'POST' })
  .validator((data: { codename: string; password: string }) => data)
  .handler(({ data }) => loginGuardian(data))

export const logout = createServerFn({ method: 'POST' }).handler(
  () => logoutGuardian(),
)

export const getCurrentGuardian = createServerFn({ method: 'GET' }).handler(
  () => getAuthenticatedGuardian(),
)
