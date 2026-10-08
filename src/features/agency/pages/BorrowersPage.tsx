import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Search, UserRound } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Note } from '@/components/ui/Note'
import { Select } from '@/components/ui/Select'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { formatDate, formatRM } from '@/lib/format'
import { agentBorrowerIds, listBorrowers, SEGMENT_ORDER, type Borrower } from '@/services/collections'
import { useDemo } from '@/state/DemoProvider'
import { RiskChip } from '../collections/parts'
import { seesAmounts } from '../collections/access'
import { AgencyPage } from '../shell/AgencyPage'
import { REPAY_TONE } from '../tones'
import { useOfficer } from '../useOfficer'

const VIEWS = ['all', 'high', 'graceEnding', 'stepsDue', 'promises'] as const
type View = (typeof VIEWS)[number]
const PAGE = 25

const inView = (b: Borrower, v: View) =>
  v === 'all' ||
  (v === 'high' && b.risk.level === 'high') ||
  (v === 'graceEnding' && b.status === 'grace' && (b.segment === 'graceSearching' || b.segment === 'graceInactive')) ||
  (v === 'stepsDue' && (!!b.plan?.callTask || (b.plan?.state === 'running' && (b.plan.dueIn ?? 99) <= 1))) ||
  (v === 'promises' && !!b.promise)

/** Borrower worklist, ordered by early-warning score. Customer service agents see only borrowers they are working. */
export default function BorrowersPage() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const { settings } = useDemo()
  const { role } = useOfficer()
  const [params, setParams] = useSearchParams()
  const { data } = useAsync(() => listBorrowers(settings), [settings])
  const [q, setQ] = useState('')
  const [segment, setSegment] = useState('')
  const [status, setStatus] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const view = (VIEWS as readonly string[]).includes(params.get('view') ?? '') ? (params.get('view') as View) : 'all'
  const agent = role === 'customerServiceAgent'
  const amounts = seesAmounts(role, settings)

  const scope = useMemo(() => {
    const all = data ?? []
    if (!agent) return all
    const mine = agentBorrowerIds(settings)
    return all.filter((b) => mine.has(b.id))
  }, [data, agent, settings])
  const rows = scope
    .filter((b) => inView(b, view) && (!q || b.code.toLowerCase().includes(q.toLowerCase()) || b.institution.toLowerCase().includes(q.toLowerCase())) && (!segment || b.segment === segment) && (!status || b.status === status))
    .sort((a, b) => b.risk.score - a.risk.score || b.dpd - a.dpd)
  const any = t('st.filter.any')

  return (
    <AgencyPage title={t('agency.nav.borrowers')} description={t('col.bo.lead')}>
      {agent && (
        <Note tone="info" className="mb-4">
          {t('col.bo.agentScope')}
        </Note>
      )}
      <div role="tablist" aria-label={t('col.bo.views')} className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {VIEWS.map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setParams(v === 'all' ? {} : { view: v }, { replace: true })}
            className={cn('h-9 shrink-0 whitespace-nowrap rounded-control border px-3 t-caption', view === v ? 'border-ink bg-ink text-on-ink' : 'border-hairline bg-surface text-ink-2 hover:text-ink')}
          >
            {t(`col.view.${v}`)} <span className="tabular">{scope.filter((b) => inView(b, v)).length}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="relative block">
          <span className="sr-only">{t('col.bo.search')}</span>
          <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('col.bo.search')} className="h-9 w-full rounded-control border border-hairline bg-surface pl-9 pr-3 t-caption text-ink placeholder:text-ink-3" />
        </label>
        <Select size="sm" label={t('col.col.segment')} hideLabel value={segment} onChange={(e) => setSegment(e.target.value)} options={[{ value: '', label: `${t('col.col.segment')}: ${any}` }, ...SEGMENT_ORDER.map((s) => ({ value: s, label: t(`col.seg.${s}`) }))]} />
        <Select size="sm" label={t('col.col.status')} hideLabel value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: '', label: `${t('col.col.status')}: ${any}` }, ...(['grace', 'goodStanding', 'behind'] as const).map((s) => ({ value: s, label: t(`rep.status.${s}`) }))]} />
      </div>

      <Card padded={false} className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title={t('ag.empty')} />
        ) : (
          <Table minWidth={1040}>
            <THead>
              <Th>{t('col.col.borrower')}</Th>
              <Th>{t('col.col.risk')}</Th>
              <Th>{t('col.col.segment')}</Th>
              <Th>{t('col.col.status')}</Th>
              <Th>{t('col.col.dpd')}</Th>
              {amounts && <Th>{t('col.col.due')}</Th>}
              <Th>{t('col.col.plan')}</Th>
              <Th>{t('col.col.lastContact')}</Th>
            </THead>
            <tbody>
              {rows.slice(0, limit).map((b) => (
                <Tr key={b.id} onClick={() => navigate(`/a/collections/borrowers/${b.id}`)}>
                  <Td className="whitespace-nowrap">
                    <span className="tabular">{b.code}</span>
                    {b.demo && (
                      <Chip tone="info" size="sm" className="ml-2" icon={<UserRound size={11} strokeWidth={1.5} />}>
                        demo
                      </Chip>
                    )}
                    <span className="block t-caption font-normal text-ink-3">{b.institution}</span>
                  </Td>
                  <Td>
                    <RiskChip b={b} />
                  </Td>
                  <Td className="whitespace-nowrap">{t(`col.seg.${b.segment}`)}</Td>
                  <Td>
                    <Chip tone={REPAY_TONE[b.status]} size="sm">
                      {t(`rep.status.${b.status}`)}
                    </Chip>
                  </Td>
                  <Td className="tabular">{b.dpd || '—'}</Td>
                  {amounts && <Td className="tabular whitespace-nowrap">{b.amountDueRM ? formatRM(b.amountDueRM) : '—'}</Td>}
                  <Td className="whitespace-nowrap text-ink-2">{b.plan ? t(`col.planState.${b.plan.state}`) : '—'}</Td>
                  <Td className="whitespace-nowrap">{b.lastContactAt ? formatDate(b.lastContactAt, lang) : '—'}</Td>
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
