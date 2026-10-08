import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, type ProgrammeSettings } from '@/config/programmeSettings'
import { readPref, writePref } from '@/lib/storage'
import { resetDb } from '@/services/db'
import { resetRepaymentDemo } from '@/services/repayment'
import { resetAuditSession } from '@/services/audit'
import type { OfficerRole } from '@/types/domain'
import { OFFICER_ROLES, PERSONA_IDS, type AppRole, type PersonaId } from './demoConstants'

export { OFFICER_ROLES, PERSONA_IDS, type AppRole, type PersonaId }


interface DemoValue {
  role: AppRole
  setRole: (r: AppRole) => void
  personaId: PersonaId
  setPersonaId: (p: PersonaId) => void
  officerRole: OfficerRole
  setOfficerRole: (r: OfficerRole) => void
  settings: ProgrammeSettings
  updateSettings: (fn: (s: ProgrammeSettings) => ProgrammeSettings) => void
  /** Increments on Reset demo; stores key their seeded state off it. */
  seed: number
  resetDemo: () => void
}

const DemoContext = createContext<DemoValue | null>(null)

/**
 * Demo-wide state. Only role, persona and officer role persist (as preferences);
 * everything else is in memory and reseeds on Reset demo.
 */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<AppRole>(() => readPref('role', ['student', 'agency'] as const, 'student'))
  const [personaId, setPersonaState] = useState<PersonaId>(() => readPref('persona', PERSONA_IDS, 'hafiz'))
  const [officerRole, setOfficerState] = useState<OfficerRole>(() => readPref('officerRole', OFFICER_ROLES, 'programmeOfficer'))
  const [settings, setSettings] = useState<ProgrammeSettings>(DEFAULT_SETTINGS)
  const [seed, setSeed] = useState(0)

  const setRole = useCallback((r: AppRole) => {
    setRoleState(r)
    writePref('role', r)
  }, [])
  const setPersonaId = useCallback((p: PersonaId) => {
    setPersonaState(p)
    writePref('persona', p)
  }, [])
  const setOfficerRole = useCallback((r: OfficerRole) => {
    setOfficerState(r)
    writePref('officerRole', r)
  }, [])
  const updateSettings = useCallback((fn: (s: ProgrammeSettings) => ProgrammeSettings) => setSettings(fn), [])
  const resetDemo = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    resetRepaymentDemo()
    resetAuditSession()
    resetDb()
    setSeed((s) => s + 1)
  }, [])

  const value = useMemo(
    () => ({ role, setRole, personaId, setPersonaId, officerRole, setOfficerRole, settings, updateSettings, seed, resetDemo }),
    [role, setRole, personaId, setPersonaId, officerRole, setOfficerRole, settings, updateSettings, seed, resetDemo],
  )
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider')
  return ctx
}
