import { COURSES, PROVIDERS } from '@/data/courses'
import type { Course, Enrolment, Provider } from '@/types/domain'
import { readDb } from './db'
import { delay } from './delay'

export interface EnrolmentView extends Enrolment {
  course: Course
  provider: Provider
}

const providerOf = (id: string) => PROVIDERS.find((p) => p.id === id)!

export function buildEnrolments(studentId: string): EnrolmentView[] {
  return (readDb().enrolments[studentId] ?? []).map((e) => {
    const course = COURSES.find((c) => c.id === e.courseId)!
    return { ...e, course, provider: providerOf(course.providerId) }
  })
}

export function listEnrolments(studentId: string) {
  return delay(buildEnrolments(studentId), 140)
}

/** Courses that close a given skill gap, free first. */
export function coursesForSkill(skillId: string): (Course & { provider: Provider })[] {
  const order = { free: 0, subsidised: 1, paid: 2 }
  return COURSES.filter((c) => c.status === 'live' && c.skillIds.includes(skillId))
    .sort((a, b) => order[a.cost] - order[b.cost])
    .map((c) => ({ ...c, provider: providerOf(c.providerId) }))
}
