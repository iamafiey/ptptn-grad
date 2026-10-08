import type { LocalizedText, MalaysianState } from '@/types/domain'

// Reference lists for onboarding preferences. `id` is what gets stored.
export const ROLE_INTERESTS: { id: string; label: LocalizedText }[] = [
  { id: 'Logistics', label: { en: 'Logistics', ms: 'Logistik' } },
  { id: 'Supply chain', label: { en: 'Supply chain', ms: 'Rantaian bekalan' } },
  { id: 'Operations', label: { en: 'Operations', ms: 'Operasi' } },
  { id: 'Marketing', label: { en: 'Marketing', ms: 'Pemasaran' } },
  { id: 'Digital marketing', label: { en: 'Digital marketing', ms: 'Pemasaran digital' } },
  { id: 'Sales', label: { en: 'Sales', ms: 'Jualan' } },
  { id: 'Finance', label: { en: 'Finance', ms: 'Kewangan' } },
  { id: 'Data & analytics', label: { en: 'Data & analytics', ms: 'Data & analitik' } },
  { id: 'Electrical engineering', label: { en: 'Electrical engineering', ms: 'Kejuruteraan elektrik' } },
  { id: 'Renewable energy', label: { en: 'Renewable energy', ms: 'Tenaga boleh baharu' } },
  { id: 'QA/QC', label: { en: 'QA/QC', ms: 'QA/QC' } },
  { id: 'Human resources', label: { en: 'Human resources', ms: 'Sumber manusia' } },
  { id: 'Customer service', label: { en: 'Customer service', ms: 'Khidmat pelanggan' } },
]

export const STATES: MalaysianState[] = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis',
  'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'WP Kuala Lumpur', 'WP Putrajaya', 'WP Labuan',
]

export const CGPA_BANDS = ['2.00 – 2.49', '2.50 – 2.99', '3.00 – 3.24', '3.25 – 3.49', '3.50 – 3.74', '3.75 – 4.00']
