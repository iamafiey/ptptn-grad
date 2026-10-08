import { personas, type DemoPersona } from '@/data/personas'
import { officers } from '@/data/officers'
import type { Officer, OfficerRole } from '@/types/domain'

export type { DemoPersona }

// Demo catalogue lookups are synchronous: the switcher must render instantly.
export function listPersonas(): DemoPersona[] {
  return personas
}

export function getPersona(id: string): DemoPersona {
  return personas.find((p) => p.id === id) ?? personas[1]
}

export function getOfficerForRole(role: OfficerRole): Officer {
  return officers.find((o) => o.role === role) ?? officers[0]
}

export function getOfficerById(id: string): Officer | undefined {
  return officers.find((o) => o.id === id)
}
