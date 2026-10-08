import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, UserRound } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import type { Stage } from '@/data/agency6'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import { listStudents } from '@/services/studentsAdmin'
import { AgencyPage } from '../shell/AgencyPage'
import { STAGE_TONE } from '../tones'

const STAGES: Stage[] = ['onboarding', 'visible', 'talking', 'offer', 'hired']
const INACTIVE_BEFORE = '2026-08-08'
const PAGE = 25

/** Masked student directory. Opening a record is logged. */
export default function StudentsPage() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const { data } = useAsync(() => listStudents(), [])
  const [q, setQ] = useState('')
  const [inst, setInst] = useState('')
  const [stage, setStage] = useState('')
  const [cohort, setCohort] = useState('')
  const [inactive, setInactive] = useState(false)
  const [limit, setLimit] = useState(PAGE)

  const all = useMemo(() => data ?? [], [data])
  const rows = all.filter(
    (s) =>
      (!q || `${s.code} ${s.institution} ${s.programme}`.toLowerCase().includes(q.toLowerCase())) &&
      (!inst || s.institutionType === inst) &&
      (!stage || s.stage === stage) &&
      (!cohort || s.cohort === cohort) &&
      (!inactive || s.lastActive < INACTIVE_BEFORE),
  )
  const cohorts = [...new Set(all.map((s) => s.cohort))].sort()
  const any = { value: '', label: t('st.filter.any') }

  return (
    <AgencyPage title={t('agency.nav.directory')} description={t('st.lead')}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end">
        <label className="relative block">
          <span className="sr-only">{t('st.filter.search')}</span>
          <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('st.filter.search')}
            className="h-9 w-full rounded-control border border-hairline bg-surface pl-9 pr-3 t-caption text-ink placeholder:text-ink-3"
          />
        </label>
        <Select size="sm" label={t('st.filter.institution')} hideLabel value={inst} onChange={(e) => setInst(e.target.value)} options={[{ ...any, label: `${t('st.filter.institution')}: ${t('st.filter.any')}` }, ...['Public university', 'Private university', 'Polytechnic', 'Community college'].map((v) => ({ value: v, label: v }))]} />
        <Select size="sm" label={t('st.filter.stage')} hideLabel value={stage} onChange={(e) => setStage(e.target.value)} options={[{ ...any, label: `${t('st.filter.stage')}: ${t('st.filter.any')}` }, ...STAGES.map((v) => ({ value: v, label: t(`st.stage.${v}`) }))]} />
        <Select size="sm" label={t('st.filter.cohort')} hideLabel value={cohort} onChange={(e) => setCohort(e.target.value)} options={[{ ...any, label: `${t('st.filter.cohort')}: ${t('st.filter.any')}` }, ...cohorts.map((v) => ({ value: v, label: v }))]} />
        <label className="flex h-9 items-center gap-2 whitespace-nowrap t-caption text-ink-2">
          <input type="checkbox" checked={inactive} onChange={(e) => setInactive(e.target.checked)} className="h-4 w-4 accent-[var(--ink)]" />
          {t('st.filter.inactive')}
        </label>
      </div>

      <Card padded={false} className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title={t('ag.empty')} />
        ) : (
          <Table minWidth={1080}>
            <THead>
              <Th>{t('st.col.student')}</Th>
              <Th>{t('st.col.institution')}</Th>
              <Th>{t('st.col.programme')}</Th>
              <Th>{t('st.col.grad')}</Th>
              <Th>{t('st.col.strength')}</Th>
              <Th>{t('st.col.visible')}</Th>
              <Th>{t('st.col.skills')}</Th>
              <Th>{t('st.col.invites')}</Th>
              <Th>{t('st.col.entries')}</Th>
              <Th>{t('st.col.stage')}</Th>
              <Th>{t('st.col.lastActive')}</Th>
            </THead>
            <tbody>
              {rows.slice(0, limit).map((s) => (
                <Tr key={s.id} onClick={() => navigate(`/a/students/${s.id}`)}>
                  <Td className="whitespace-nowrap">
                    <span className="tabular">{s.code}</span>
                    {s.demo && (
                      <Chip tone="info" size="sm" className="ml-2" icon={<UserRound size={11} strokeWidth={1.5} />}>
                        demo
                      </Chip>
                    )}
                    <span className="block t-caption font-normal text-ink-3">{t('st.masked')}</span>
                  </Td>
                  <Td>{s.institution}</Td>
                  <Td>{s.programme}</Td>
                  <Td className="tabular">{s.graduationYear}</Td>
                  <Td className="tabular">{s.profileStrength}%</Td>
                  <Td>{s.visible ? t('st.yes') : t('st.no')}</Td>
                  <Td className="tabular">{s.skillsCount}</Td>
                  <Td className="tabular">{s.invitations}</Td>
                  <Td className="tabular">{s.jobSearchEntries}</Td>
                  <Td>
                    <Chip tone={STAGE_TONE[s.stage]} size="sm">
                      {t(`st.stage.${s.stage}`)}
                    </Chip>
                  </Td>
                  <Td className="whitespace-nowrap">{formatDate(s.lastActive, lang)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 t-caption text-ink-2">
        <span>{t('st.showing', { shown: Math.min(limit, rows.length), total: rows.length })}</span>
        {rows.length > limit && (
          <button onClick={() => setLimit((l) => l + PAGE)} className="rounded-control px-2 py-1 text-ink hover:bg-surface-muted">
            {t('st.more')}
          </button>
        )}
      </div>
    </AgencyPage>
  )
}
