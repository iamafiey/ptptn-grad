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
}

export interface AgencySection {
  id: string
  path: string
  label: I18nKey
  icon: LucideIcon
  roles: OfficerRole[] | 'all'
  items?: AgencyNavItem[]
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
    id: 'tiers',
    path: '/a/tiers',
    label: 'agency.nav.tiers',
    icon: Scale,
    roles: ['collectionLiaison', 'superAdmin'],
    items: [
      { path: '/a/tiers', label: 'agency.nav.tierRules' },
      { path: '/a/tiers/sync', label: 'agency.nav.sync' },
      { path: '/a/tiers/overrides', label: 'agency.nav.overrides' },
      { path: '/a/tiers/distribution', label: 'agency.nav.distribution' },
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

/** Queues route to their owning section for access checks. */
export function sectionForPath(pathname: string): AgencySection | undefined {
  if (pathname.startsWith('/a/queues')) return AGENCY_SECTIONS[0]
  return [...AGENCY_SECTIONS].sort((a, b) => b.path.length - a.path.length).find((s) => pathname.startsWith(s.path))
}
