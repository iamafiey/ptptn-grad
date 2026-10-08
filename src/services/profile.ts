import type { ScoredSkill, Student } from '@/types/domain'

// What a Talent Partner sees before the student accepts contact (docs §Skill profile: "See as employer").
// Name, IC and photo are removed; hidden and disputed skills never leave this function.

export interface EmployerProfile {
  candidateCode: string
  headline: string
  institution: string
  programme: string
  graduationYear: number
  graduated: boolean
  state: string
  summary: string
  skills: ScoredSkill[]
}

const VISIBLE: ScoredSkill['status'][] = ['kept', 'loweredByStudent', 'studentAdded']

export function employerVisibleSkills(skills: ScoredSkill[]) {
  return skills.filter((s) => VISIBLE.includes(s.status))
}

export function toEmployerView(student: Student, skills: ScoredSkill[]): EmployerProfile {
  const scrub = (text: string) =>
    [student.fullName, student.preferredName, ...student.fullName.split(' ').filter((p) => p.length > 3)].reduce(
      (t, n) => t.split(n).join('the candidate'),
      text,
    )
  return {
    candidateCode: `Candidate ${student.id.slice(0, 2).toUpperCase()}-${(student.graduationYear % 100) * 100 + student.id.length * 13}`,
    headline: student.programme,
    institution: student.institution,
    programme: student.programme,
    graduationYear: student.graduationYear,
    graduated: !student.isFinalYear,
    state: student.state,
    summary: scrub(student.summary.en),
    skills: employerVisibleSkills(skills),
  }
}
