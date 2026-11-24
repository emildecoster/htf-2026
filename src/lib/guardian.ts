export const GUARDIAN_ROLES = [
  'DEFENDER',
  'COMMANDER',
] as const

export type GuardianRole = (typeof GUARDIAN_ROLES)[number]

export type Guardian = {
  guardianId: string
  codename: string
  role: GuardianRole
}
