import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  FileCheck2,
  Handshake,
  House,
  Scale,
  Settings,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import type { I18nKey } from '@/i18n/en'
import type { OfficerRole } from '@/types/domain'

export interface AgencyNavItem {
  path: string
  label: I18nKey
  /** Narrows the section's roles for this item (and every path under it). */
  roles?: OfficerRole[]
}

export interface AgencySection {
  id: string
  path: string
  label: I18nKey
  icon: LucideIcon
  roles: OfficerRole[] | 'all'
  items?: AgencyNavItem[]
  /** Extra path prefixes that belong to this section (e.g. tier pages under Collections). */
  match?: string[]
}

// docs/admin-dashboard-flow.md §Navigation — each role sees only its sections.
export const AGENCY_SECTIONS: AgencySection[] = [
  { id: 'home', path: '/a/home', label: 'agency.nav.home', icon: House, roles: 'all' },
  {
    id: 'job-search',
    path: '/a/job-search',
    label: 'agency.nav.jobSearch',
    icon: FileCheck2,
    roles: ['programmeOfficer', 'superAdmin'],
    items: [
      { path: '/a/job-search/evidence', label: 'agency.nav.evidenceQueue' },
      { path: '/a/job-search/monitor', label: 'agency.nav.evidenceMonitor' },
      { path: '/a/job-search/placements', label: 'agency.nav.placements' },
    ],
  },
  {
    id: 'partners',
    path: '/a/partners',
    label: 'agency.nav.partners',
    icon: Handshake,
    roles: ['partnershipManager', 'programmeOfficer', 'superAdmin'],
    items: [
      { path: '/a/partners', label: 'agency.nav.talentPartners' },
      { path: '/a/partners/approvals', label: 'agency.nav.roleApprovals' },
      { path: '/a/partners/portals', label: 'agency.nav.portalFeeds' },
      { path: '/a/partners/matching', label: 'agency.nav.matching' },
    ],
  },
  {
    id: 'students',
    path: '/a/students',
    label: 'agency.nav.students',
    icon: UsersRound,
    roles: ['programmeOfficer', 'aiGovernanceLead', 'superAdmin'],
    items: [
      { path: '/a/students', label: 'agency.nav.directory' },
      { path: '/a/students/disputes', label: 'agency.nav.disputes' },
      { path: '/a/students/flags', label: 'agency.nav.flags' },
    ],
  },
  { id: 'learn', path: '/a/learn', label: 'agency.nav.learn', icon: BookOpen, roles: ['learningManager', 'superAdmin'] },
  {
    id: 'ai',
    path: '/a/ai',
    label: 'agency.nav.ai',
    icon: BrainCircuit,
    roles: ['aiGovernanceLead', 'superAdmin'],
    items: [
      { path: '/a/ai/taxonomy', label: 'agency.nav.taxonomy' },
      { path: '/a/ai/rubric', label: 'agency.nav.rubric' },
      { path: '/a/ai/evidence-rules', label: 'agency.nav.evidenceRules' },
      { path: '/a/ai/quality', label: 'agency.nav.quality' },
    ],
  },
  {
    id: 'collections',
    path: '/a/collections',
    label: 'agency.nav.collections',
    icon: Scale,
    roles: ['collectionLiaison', 'customerServiceAgent', 'superAdmin', 'leadershipViewer'],
    match: ['/a/tiers'],
    items: [
      { path: '/a/collections', label: 'agency.nav.colOverview', roles: ['collectionLiaison', 'superAdmin', 'leadershipViewer'] },
      { path: '/a/collections/borrowers', label: 'agency.nav.borrowers', roles: ['collectionLiaison', 'customerServiceAgent', 'superAdmin'] },
      { path: '/a/collections/plans', label: 'agency.nav.plans', roles: ['collectionLiaison', 'superAdmin'] },
      { path: '/a/collections/service', label: 'agency.nav.serviceDesk', roles: ['collectionLiaison', 'customerServiceAgent', 'superAdmin'] },
      { path: '/a/tiers', label: 'agency.nav.tierRules', roles: ['collectionLiaison', 'superAdmin'] },
      { path: '/a/tiers/sync', label: 'agency.nav.sync', roles: ['collectionLiaison', 'superAdmin'] },
      { path: '/a/tiers/overrides', label: 'agency.nav.overrides', roles: ['collectionLiaison', 'superAdmin'] },
      { path: '/a/tiers/distribution', label: 'agency.nav.distribution', roles: ['collectionLiaison', 'superAdmin'] },
    ],
  },
  {
    id: 'reports',
    path: '/a/reports',
    label: 'agency.nav.reports',
    icon: BarChart3,
    roles: 'all',
    items: [
      { path: '/a/reports', label: 'agency.nav.allReports' },
      { path: '/a/reports/cohort', label: 'agency.nav.cohort' },
    ],
  },
  { id: 'settings', path: '/a/settings', label: 'agency.nav.settings', icon: Settings, roles: ['superAdmin'] },
]

export function canSee(section: AgencySection, role: OfficerRole) {
  return section.roles === 'all' || section.roles.includes(role)
}

export function itemsFor(section: AgencySection, role: OfficerRole) {
  return (section.items ?? []).filter((it) => !it.roles || it.roles.includes(role))
}

const prefixes = (s: AgencySection) => [s.path, ...(s.match ?? [])]
const under = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(prefix + '/')

/** Queues route to their owning section for access checks. */
export function sectionForPath(pathname: string): AgencySection | undefined {
  if (pathname.startsWith('/a/queues')) return AGENCY_SECTIONS[0]
  let best: { s: AgencySection; len: number } | undefined
  for (const s of AGENCY_SECTIONS) for (const p of prefixes(s)) if (under(pathname, p) && (!best || p.length > best.len)) best = { s, len: p.length }
  return best?.s
}

/** Section roles, narrowed by the most specific nav item the path falls under. */
export function canAccess(pathname: string, role: OfficerRole) {
  const section = sectionForPath(pathname)
  if (!section) return true
  if (!canSee(section, role)) return false
  const item = [...(section.items ?? [])].sort((a, b) => b.path.length - a.path.length).find((it) => under(pathname, it.path))
  return !item?.roles || item.roles.includes(role)
}
