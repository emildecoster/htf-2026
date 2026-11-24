import { db } from './index.ts'
import { echoes, glitches, guardians } from './schema.ts'

const glitchRows: (typeof glitches.$inferInsert)[] = [
  { glitchId: 'GL-0142', status: 'LEAKED', description: 'Time loop detected near the eastern clock tower', timestamp: '2026-11-10T13:42:00Z' },
  { glitchId: 'GL-0141', status: 'ASSESSING', description: 'Magic reserves dropping faster than expected', timestamp: '2026-11-10T11:05:00Z' },
  { glitchId: 'GL-0139', status: 'CONTAINING', description: 'Portal flicker in the archive vaults', timestamp: '2026-11-09T22:17:00Z' },
  { glitchId: 'GL-0137', status: 'FIXED', description: 'Echo sensors reporting duplicate signals', timestamp: '2026-11-08T08:30:00Z' },
]

const guardianRows: (typeof guardians.$inferInsert)[] = [
  { guardianId: 'GD-0001', codename: 'ShadowFox', role: 'DEFENDER' },
  { guardianId: 'GD-0002', codename: 'IronClad', role: 'DEFENDER' },
  { guardianId: 'GD-0003', codename: 'SilverHawk', role: 'COMMANDER' },
  { guardianId: 'GD-0004', codename: 'NightOwl', role: 'COMMANDER' },
]

const echoRows: (typeof echoes.$inferInsert)[] = [
  { echoId: 'EC-1001', glitchId: 'GL-0142', reportingGuardianId: 'GD-0001', description: 'Observed a time loop near the eastern clock tower, causing temporal anomalies.', timestamp: '2026-11-10T13:45:00Z' },
  { echoId: 'EC-1002', glitchId: 'GL-0141', reportingGuardianId: 'GD-0002', description: 'Magic reserves are depleting faster than anticipated, need immediate assessment.', timestamp: '2026-11-10T11:10:00Z' },
  { echoId: 'EC-1003', glitchId: 'GL-0139', reportingGuardianId: 'GD-0003', description: 'Detected portal flicker in the archive vaults, potential security risk.', timestamp: '2026-11-09T22:20:00Z' },
  { echoId: 'EC-1004', glitchId: 'GL-0137', reportingGuardianId: 'GD-0004', description: 'Echo sensors are reporting duplicate signals, issue has been resolved.', timestamp: '2026-11-08T08:35:00Z' },
]

// Wipe and refill so the seed can be re-run safely.
db.transaction((tx) => {
  tx.delete(echoes).run()
  tx.delete(guardians).run()
  tx.delete(glitches).run()

  tx.insert(glitches).values(glitchRows).run()
  tx.insert(guardians).values(guardianRows).run()
  tx.insert(echoes).values(echoRows).run()
})

console.log(`Seeded ${glitchRows.length} glitches.`)
console.log(`Seeded ${guardianRows.length} guardians.`)
console.log(`Seeded ${echoRows.length} echoes.`)
