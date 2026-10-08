import { CATEGORIES, MODEL_VERSION, RUBRIC_VERSION, SKILLS, TAXONOMY_VERSION } from '@/data/taxonomy'
import type { SkillCategory, TaxonomySkill } from '@/types/domain'
import { delay } from './delay'

// Taxonomy is reference data the UI needs synchronously (skill names on every card),
// so lookups are sync; the full tree is also exposed async like a real API.

export function skillById(id: string): TaxonomySkill | undefined {
  return SKILLS.find((s) => s.id === id)
}

export function listCategories(): SkillCategory[] {
  return CATEGORIES
}

export function listSkills(): TaxonomySkill[] {
  return SKILLS
}

export function getTaxonomy() {
  return delay({ version: TAXONOMY_VERSION, categories: CATEGORIES, skills: SKILLS })
}

export const AI_VERSIONS = { model: MODEL_VERSION, rubric: RUBRIC_VERSION, taxonomy: TAXONOMY_VERSION.version }
