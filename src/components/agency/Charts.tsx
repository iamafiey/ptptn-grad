import { useState, type ReactNode } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Table as TableIcon, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useT } from '@/i18n'
import { Table, THead, Th, Td, Tr } from './Table'

// Charts follow the dataviz method: validated series tokens (--series-*), 2px lines, rounded data ends,
// recessive solid grid, legend for ≥2 series, hover tooltip, and a table view for every chart.

const AXIS = { fontSize: 11, fill: 'var(--ink-3)' }

function TooltipCard({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-control border border-hairline bg-surface px-3 py-2 shadow-2 t-caption">
      <p className="mb-1 text-ink-2">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-ink">
          {r.color && <span className="h-2 w-2 rounded-chip" style={{ background: r.color }} aria-hidden />}
          <span className="text-ink-2">{r.label}</span>
          <span className="ml-auto pl-3 tabular">{r.value}</span>
        </p>
      ))}
    </div>
  )
}

/** Card with a title, an optional legend, and a chart ↔ table toggle. */
export function ChartCard({
  title,
  legend,
  chart,
  table,
}: {
  title: string
  legend?: { label: string; color: string }[]
  chart: ReactNode
  table: ReactNode
}) {
  const { t } = useT()
  const [asTable, setAsTable] = useState(false)
  return (
    <Card>
      <SectionLabel
        action={
          <button onClick={() => setAsTable((v) => !v)} className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 t-caption text-ink-2 hover:bg-surface-muted hover:text-ink">
            {asTable ? <BarChart3 size={14} strokeWidth={1.5} /> : <TableIcon size={14} strokeWidth={1.5} />}
            {asTable ? t('ag.mon.chart') : t('ag.mon.table')}
          </button>
        }
      >
        {title}
      </SectionLabel>
      {legend && !asTable && (
        <ul className="mt-2 flex flex-wrap gap-4 t-caption text-ink-2">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-chip" style={{ background: l.color }} aria-hidden />
              {l.label}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">{asTable ? table : chart}</div>
    </Card>
  )
}

/** Single-series trend (no legend: the card title names it). */
export function TrendChart<T extends Record<string, unknown>>({ data, x, y, label, format = (v) => String(v), height = 200, domain }: { data: T[]; x: keyof T; y: keyof T; label: string; format?: (v: number) => string; height?: number; domain?: [number, number] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`fill-${String(y)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey={x as string} tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={48} domain={domain} tickFormatter={(v) => format(Number(v))} />
        <Tooltip
          cursor={{ stroke: 'var(--ink-3)', strokeWidth: 1 }}
          content={({ active, payload, label: l }) =>
            active && payload?.length ? <TooltipCard title={String(l)} rows={[{ label, value: format(Number(payload[0].value)), color: 'var(--series-1)' }]} /> : null
          }
        />
        <Area type="monotone" dataKey={y as string} stroke="var(--series-1)" strokeWidth={2} fill={`url(#fill-${String(y)})`} activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Stacked bars, up to 3 validated series; 2px surface gap between segments; rounded top on the last. */
export function StackedBars<T extends Record<string, unknown>>({ data, x, series, height = 220 }: { data: T[]; x: keyof T; series: { key: keyof T; label: string; color: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey={x as string} tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          cursor={{ fill: 'var(--surface-muted)' }}
          content={({ active, payload, label: l }) =>
            active && payload?.length ? (
              <TooltipCard title={String(l)} rows={series.map((s) => ({ label: s.label, value: String(payload.find((p) => p.dataKey === s.key)?.value ?? '—'), color: s.color }))} />
            ) : null
          }
        />
        {series.map((s, i) => (
          <Bar key={String(s.key)} dataKey={s.key as string} stackId="a" fill={s.color} stroke="var(--surface)" strokeWidth={1} radius={i === series.length - 1 ? [4, 4, 0, 0] : 0} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Generic table view for chart data. */
export function DataTableView({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <Table minWidth={420}>
      <THead>
        {columns.map((c) => (
          <Th key={c}>{c}</Th>
        ))}
      </THead>
      <tbody>
        {rows.map((r, i) => (
          <Tr key={i}>
            {r.map((cell, j) => (
              <Td key={j} className={j > 0 ? 'tabular' : undefined}>
                {cell}
              </Td>
            ))}
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}
