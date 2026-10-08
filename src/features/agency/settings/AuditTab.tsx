import { useState } from 'react'
import { FileDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { logAudit, listAudit } from '@/services/audit'
import { getOfficerById } from '@/services/demo'
import type { Officer } from '@/types/domain'

const PAGE = 40
const fmt = (iso: string, lang: 'en' | 'ms') =>
  new Intl.DateTimeFormat(lang === 'ms' ? 'ms-MY' : 'en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(iso))

/** Read-only, searchable, exportable audit log: who, what, which record, when, where, why. */
export function AuditTab({ officer }: { officer: Officer }) {
  const { t, lang } = useT()
  const toast = useToast()
  const { data } = useAsync(() => listAudit(), [])
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const all = data ?? []
  const types = [...new Set(all.map((a) => a.recordType))].sort()
  const name = (id: string) => getOfficerById(id)?.name ?? id
  const rows = all.filter((a) => (!type || a.recordType === type) && (!q || `${a.action} ${a.recordId} ${a.reason ?? ''} ${name(a.officerId)}`.toLowerCase().includes(q.toLowerCase())))

  const exportCsv = () => {
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
    const lines = ['at,officer,action,recordType,recordId,reason,where', ...rows.map((a) => [a.at, name(a.officerId), a.action, a.recordType, a.recordId, a.reason ?? '', a.where].map(esc).join(','))]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    const el = document.createElement('a')
    el.href = url
    el.download = 'ptptn-audit-log.csv'
    el.click()
    URL.revokeObjectURL(url)
    logAudit(officer, 'Exported audit log', 'audit', `${rows.length} entries`)
    toast(t('rp.exported'))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="relative block">
          <span className="sr-only">{t('se.audit.search')}</span>
          <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('se.audit.search')} className="h-9 w-full rounded-control border border-hairline bg-surface pl-9 pr-3 t-caption text-ink placeholder:text-ink-3" />
        </label>
        <Select size="sm" hideLabel label={t('se.audit.type')} value={type} onChange={(e) => setType(e.target.value)} options={[{ value: '', label: t('se.audit.allTypes') }, ...types.map((x) => ({ value: x, label: x }))]} />
        <Button variant="secondary" size="sm" icon={<FileDown size={14} strokeWidth={1.5} />} onClick={exportCsv}>
          {t('rp.exportCsv')}
        </Button>
      </div>
      <Card padded={false} className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title={t('ag.empty')} />
        ) : (
          <Table minWidth={980}>
            <THead>
              <Th>{t('se.audit.when')}</Th>
              <Th>{t('se.audit.who')}</Th>
              <Th>{t('se.audit.what')}</Th>
              <Th>{t('se.audit.record')}</Th>
              <Th>{t('ag.col.reason')}</Th>
              <Th>{t('se.audit.where')}</Th>
            </THead>
            <tbody>
              {rows.slice(0, limit).map((a) => (
                <Tr key={a.id}>
                  <Td className="whitespace-nowrap tabular">{fmt(a.at, lang)}</Td>
                  <Td className="whitespace-nowrap">{name(a.officerId)}</Td>
                  <Td>{a.action}</Td>
                  <Td className="whitespace-nowrap">
                    <span className="text-ink-3">{a.recordType}</span> <span className="tabular">{a.recordId}</span>
                  </Td>
                  <Td className="max-w-[260px] text-ink-2">{a.reason ?? '—'}</Td>
                  <Td className="whitespace-nowrap text-ink-3">{a.where}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-2 t-caption text-ink-2">
        <span>{t('st.showing', { shown: Math.min(limit, rows.length), total: rows.length })}</span>
        {rows.length > limit && (
          <button onClick={() => setLimit((l) => l + PAGE)} className="rounded-control px-2 py-1 text-ink hover:bg-surface-muted">
            {t('st.more')}
          </button>
        )}
      </div>
    </div>
  )
}
