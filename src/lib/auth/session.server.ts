import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'

const COOKIE_NAME = 'guardian_id'

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export function setGuardianCookie(guardianId: string) {
  setCookie(COOKIE_NAME, guardianId, {
    ...cookieOptions,
    maxAge: 60 * 60 * 8, // 8 hours
  })
}

export function getGuardianCookie() {
  return getCookie(COOKIE_NAME) ?? null
}

export function clearGuardianCookie() {
  deleteCookie(COOKIE_NAME, cookieOptions)
}
