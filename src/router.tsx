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
      { path: 'home', lazy: ap('home') },
      { path: 'queues/:queueId', lazy: ap('queue') },
      { path: 'job-search', element: <Navigate to="evidence" replace /> },
      { path: 'job-search/evidence', lazy: ap('evidence') },
      { path: 'job-search/monitor', lazy: ap('monitor') },
      { path: 'job-search/placements', lazy: ap('placements') },
      { path: 'partners', lazy: ap('partners') },
      { path: 'partners/approvals', lazy: ap('approvals') },
      { path: 'partners/portals', lazy: ap('portals') },
      { path: 'partners/matching', lazy: ap('matching') },
      { path: 'partners/:partnerId', lazy: ap('partner') },
      { path: 'students', lazy: ap('students') },
      { path: 'students/disputes', lazy: ap('disputes') },
      { path: 'students/flags', lazy: ap('flags') },
      { path: 'students/:studentId', lazy: ap('student') },
      { path: 'learn', lazy: ap('learn') },
      { path: 'ai', element: <Navigate to="taxonomy" replace /> },
      { path: 'ai/taxonomy', lazy: ap('taxonomy') },
      { path: 'ai/rubric', lazy: ap('rubric') },
      { path: 'ai/evidence-rules', lazy: ap('evidenceRules') },
      { path: 'ai/quality', lazy: ap('quality') },
      { path: 'tiers', lazy: ap('tiers') },
      { path: 'tiers/sync', lazy: ap('sync') },
      { path: 'tiers/overrides', lazy: ap('overrides') },
      { path: 'tiers/distribution', lazy: ap('distribution') },
      { path: 'reports', lazy: ap('reports') },
      { path: 'reports/cohort', lazy: ap('cohort') },
      { path: 'reports/:reportId', lazy: ap('report') },
      { path: 'settings', lazy: ap('settings') },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
])
