import { useAsync } from '@/hooks/useAsync'
import { getStudentState } from '@/services/students'
import { useDemo } from '@/state/DemoProvider'

/** The current demo persona's live record (re-fetches after any write or Reset demo). */
export function useStudent() {
  const { personaId } = useDemo()
  const q = useAsync(() => getStudentState(personaId), [personaId])
  return { id: personaId, ...q }
}
