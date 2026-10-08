import { getOfficerForRole } from '@/services/demo'
import { useDemo } from '@/state/DemoProvider'

/** The signed-in officer for the selected role. Leadership viewer is read-only everywhere. */
export function useOfficer() {
  const { officerRole } = useDemo()
  const officer = getOfficerForRole(officerRole)
  return { officer, role: officerRole, readOnly: officerRole === 'leadershipViewer' }
}
