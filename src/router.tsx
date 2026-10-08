import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { readPref } from '@/lib/storage'
import { studentHomePath } from '@/services/students'
import { PERSONA_IDS } from '@/state/demoConstants'

// Each workspace loads in its own chunk.
const studentShell = () => import('@/features/student/shell/StudentShell')
const onboarding = () => import('@/features/student/onboarding/OnboardingStep')
const agencyShell = () => import('@/features/agency/shell/AgencyShell')
const agencyPages = () => import('@/features/agency/pages/AgencyPlaceholders')


type AgencyPageId = import('@/features/agency/pages/AgencyPlaceholders').AgencyPageId
const ap = (page: AgencyPageId): RouteObject['lazy'] => async () => {
  const { AgencyPlaceholder } = await agencyPages()
  return { Component: () => <AgencyPlaceholder page={page} /> }
}

function RootRedirect() {
  const role = readPref('role', ['student', 'agency'] as const, 'student')
  const persona = readPref('persona', PERSONA_IDS, 'hafiz')
  return <Navigate to={role === 'agency' ? '/a/home' : studentHomePath(persona)} replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/styleguide', lazy: async () => ({ Component: (await import('@/routes/styleguide/Styleguide')).default }) },

  // Student onboarding: same column, no tab bar.
  {
    path: '/s/onboarding',
    lazy: async () => {
      const { default: Shell } = await studentShell()
      return { Component: () => <Shell chrome="none" /> }
    },
    children: [
      { index: true, element: <Navigate to="signin" replace /> },
      { path: ':step', lazy: async () => ({ Component: (await onboarding()).default }) },
    ],
  },

  // Student workspace
  {
    path: '/s',
    lazy: async () => ({ Component: (await studentShell()).default }),
    children: [
      { index: true, element: <Navigate to="home" replace /> },
      { path: 'home', lazy: async () => ({ Component: (await import('@/features/student/pages/HomePage')).default }) },
      { path: 'profile', lazy: async () => ({ Component: (await import('@/features/student/pages/ProfilePage')).default }) },
      { path: 'profile/cv', lazy: async () => ({ Component: (await import('@/features/student/pages/CvPage')).default }) },
      { path: 'opportunities', lazy: async () => ({ Component: (await import('@/features/student/pages/OpportunitiesPage')).default }) },
      { path: 'learn', lazy: async () => ({ Component: (await import('@/features/student/pages/LearnPage')).default }) },
      { path: 'learn/gap/:skillId', lazy: async () => ({ Component: (await import('@/features/student/pages/GapPage')).default }) },
      { path: 'repayment', lazy: async () => ({ Component: (await import('@/features/student/pages/RepaymentPage')).default }) },
      { path: 'notifications', lazy: async () => ({ Component: (await import('@/features/student/pages/NotificationsPage')).default }) },
    ],
  },

  // Agency workspace
  {
    path: '/a',
    lazy: async () => ({ Component: (await agencyShell()).default }),
    children: [
      { index: true, element: <Navigate to="home" replace /> },
      { path: 'home', lazy: async () => ({ Component: (await import('@/features/agency/pages/AgencyHome')).default }) },
      { path: 'queues/:queueId', lazy: async () => ({ Component: (await import('@/features/agency/pages/QueuePage')).default }) },
      { path: 'job-search', element: <Navigate to="evidence" replace /> },
      { path: 'job-search/evidence', lazy: async () => ({ Component: (await import('@/features/agency/pages/EvidencePage')).default }) },
      { path: 'job-search/monitor', lazy: async () => ({ Component: (await import('@/features/agency/pages/MonitorPage')).default }) },
      { path: 'job-search/placements', lazy: async () => ({ Component: (await import('@/features/agency/pages/PlacementsPage')).default }) },
      { path: 'partners', lazy: async () => ({ Component: (await import('@/features/agency/pages/PartnersPage')).default }) },
      { path: 'partners/approvals', lazy: async () => ({ Component: (await import('@/features/agency/pages/ApprovalsPage')).default }) },
      { path: 'partners/portals', lazy: async () => ({ Component: (await import('@/features/agency/pages/PortalsPage')).default }) },
      { path: 'partners/matching', lazy: async () => ({ Component: (await import('@/features/agency/pages/MatchingPage')).default }) },
      { path: 'partners/:partnerId', lazy: async () => ({ Component: (await import('@/features/agency/pages/PartnerRecordPage')).default }) },
      { path: 'students', lazy: async () => ({ Component: (await import('@/features/agency/pages/StudentsPage')).default }) },
      { path: 'students/disputes', lazy: async () => ({ Component: (await import('@/features/agency/pages/DisputesPage')).default }) },
      { path: 'students/flags', lazy: async () => ({ Component: (await import('@/features/agency/pages/FlagsPage')).default }) },
      { path: 'students/:studentId', lazy: async () => ({ Component: (await import('@/features/agency/pages/StudentRecordPage')).default }) },
      { path: 'learn', lazy: async () => ({ Component: (await import('@/features/agency/pages/AgencyLearnPage')).default }) },
      { path: 'ai', element: <Navigate to="taxonomy" replace /> },
      { path: 'ai/taxonomy', lazy: async () => ({ Component: (await import('@/features/agency/pages/TaxonomyPage')).default }) },
      { path: 'ai/rubric', lazy: async () => ({ Component: (await import('@/features/agency/pages/RubricPage')).default }) },
      { path: 'ai/evidence-rules', lazy: async () => ({ Component: (await import('@/features/agency/pages/EvidenceRulesPage')).default }) },
      { path: 'ai/quality', lazy: async () => ({ Component: (await import('@/features/agency/pages/QualityPage')).default }) },
      { path: 'tiers', lazy: async () => ({ Component: (await import('@/features/agency/pages/TierRulesPage')).default }) },
      { path: 'tiers/sync', lazy: async () => ({ Component: (await import('@/features/agency/pages/SyncPage')).default }) },
      { path: 'tiers/overrides', lazy: async () => ({ Component: (await import('@/features/agency/pages/OverridesPage')).default }) },
      { path: 'tiers/distribution', lazy: async () => ({ Component: (await import('@/features/agency/pages/DistributionPage')).default }) },
      { path: 'reports', lazy: ap('reports') },
      { path: 'reports/cohort', lazy: ap('cohort') },
      { path: 'reports/:reportId', lazy: ap('report') },
      { path: 'settings', lazy: ap('settings') },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
])
