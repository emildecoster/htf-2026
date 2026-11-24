
import type { Glitch } from './glitch.ts'

const MAGIC_PENALTIES: Record<Glitch['status'], number> = {
  LEAKED: 10,
  ASSESSING: 10,
  CONTAINING: 5,
  FIXED: 0,
}

export function calculateMagic(glitches: Glitch[]): number {
  const totalPenalty = glitches.reduce(
    (total, glitch) => total + MAGIC_PENALTIES[glitch.status],
    0,
  )

  return Math.max(0, 100 - totalPenalty)
}
