import type { StudentState } from '@/services/students'

export interface StepProps {
  state: StudentState
  next: () => void
  goTo: (stepId: string) => void
}
