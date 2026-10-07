import { createContext, useContext } from 'react'

export interface StudentShellValue {
  openSettings: () => void
  openDemo: () => void
}

export const StudentShellContext = createContext<StudentShellValue | null>(null)

export function useStudentShell() {
  const ctx = useContext(StudentShellContext)
  if (!ctx) throw new Error('useStudentShell must be used inside StudentShell')
  return ctx
}
