// Settings area seed data: PDPA requests, consent versions, keyword monitor, integrations (fictional).

export interface DataRequest {
  id: string
  studentCode: string
  kind: 'access' | 'correction' | 'deletion'
  receivedAt: string
  dueAt: string
  status: 'open' | 'removedFromSearch' | 'completed'
}

export const DATA_REQUESTS_SEED: DataRequest[] = [
  { id: 'DR-3011', studentCode: 'S-22874', kind: 'deletion', receivedAt: '2026-10-01', dueAt: '2026-10-22', status: 'open' },
  { id: 'DR-3010', studentCode: 'S-25190', kind: 'access', receivedAt: '2026-09-29', dueAt: '2026-10-20', status: 'open' },
  { id: 'DR-3008', studentCode: 'S-21402', kind: 'correction', receivedAt: '2026-09-24', dueAt: '2026-10-15', status: 'open' },
  { id: 'DR-2997', studentCode: 'S-24410', kind: 'deletion', receivedAt: '2026-09-02', dueAt: '2026-09-23', status: 'completed' },
]

export const CONSENT_VERSIONS = [
  { version: 'v3.1', publishedAt: '2026-06-01', accepted: 17240, summary: 'Adds Talent Partner contact and portal evidence checks.' },
  { version: 'v3.0', publishedAt: '2026-01-15', accepted: 1180, summary: 'Adds AI skill translation and repayment-tier benefits.' },
  { version: 'v2.4', publishedAt: '2025-07-01', accepted: 0, summary: 'Retired. Students re-consented to v3.x.' },
]

export interface ChatFlag {
  id: string
  partner: string
  excerpt: string
  keyword: string
  at: string
}

export const CHAT_FLAGS_SEED: ChatFlag[] = [
  { id: 'KW-118', partner: 'Dian Retail Group', excerpt: '…a small RM 150 processing fee to confirm your slot…', keyword: 'fee', at: '2026-10-06' },
  { id: 'KW-117', partner: 'Kestrel Aero Services', excerpt: '…please send your bank login so payroll can be set up…', keyword: 'bank login', at: '2026-10-04' },
]

export const INTEGRATIONS = [
  { id: 'repayment', status: 'degraded' },
  { id: 'crm', status: 'planned' },
  { id: 'portals', status: 'ok' },
  { id: 'university', status: 'ok' },
  { id: 'ssm', status: 'ok' },
  { id: 'messaging', status: 'ok' },
] as const

export const SCAM_NOTICE = {
  en: 'Safety notice: PTPTN and Talent Partners never ask for fees, bank logins or OTP codes. Report any request like this in the app.',
  ms: 'Notis keselamatan: PTPTN dan Rakan Bakat tidak akan meminta yuran, log masuk bank atau kod OTP. Laporkan sebarang permintaan sebegini dalam aplikasi.',
}
