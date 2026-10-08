import { asset } from '@/lib/asset'

// Job families give every role and job a picture, so lists can be scanned by shape before reading.
// Classified deterministically from the title (first matching rule wins).

export type JobFamily = 'logistics' | 'data' | 'finance' | 'marketing' | 'engineering' | 'people' | 'tech' | 'general'
export const JOB_FAMILIES: JobFamily[] = ['logistics', 'data', 'finance', 'marketing', 'engineering', 'tech', 'people', 'general']

const RULES: [JobFamily, RegExp][] = [
  ['tech', /developer|software|python|programmer|it support/i],
  ['logistics', /logistic|supply chain|inventory|procure|purchas|transport|warehouse|operations|planner/i],
  ['finance', /account|finance|financial|audit|credit|treasury/i],
  ['data', /data|analyst|analytics|research|business intelligence/i],
  ['engineering', /engineer|technician|qa\b|qa\/|quality|solar|maintenance|grid/i],
  ['marketing', /marketing|brand|social media|sales|event|digital|customer success/i],
  ['people', /\bhr\b|human resource|customer service|people|trainee|associate|coordinator/i],
]

export function jobFamily(title: string): JobFamily {
  return RULES.find(([, re]) => re.test(title))?.[0] ?? 'general'
}

export const familyThumb = (f: JobFamily) => asset(`job-families/${f}.svg`)
