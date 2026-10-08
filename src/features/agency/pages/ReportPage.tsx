import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Note } from "@/components/ui/Note";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import {
  ChartCard,
  DataTableView,
  StackedBars,
  TrendChart,
} from "@/components/agency/Charts";
import { Table, THead, Th, Td, Tr } from "@/components/agency/Table";
import { useAsync } from "@/hooks/useAsync";
import { useT } from "@/i18n";
import { formatDate, formatNumber } from "@/lib/format";
import {
  DEFAULT_FILTERS,
  FILTER_OPTIONS,
  getReport,
  logExport,
  reportsForRole,
  type Cell,
  type Kpi,
  type ReportFilters,
  type ReportId,
} from "@/services/reports";
import { useDemo } from "@/state/DemoProvider";
import { AgencyPage } from "../shell/AgencyPage";
import { useOfficer } from "../useOfficer";

const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];

/** Shared report pattern: headline numbers with change, one main chart, breakdown table, filters, export. */
export default function ReportPage() {
  const { reportId = "" } = useParams();
  const { t, lt, lang } = useT();
  const toast = useToast();
  const { settings } = useDemo();
  const { officer, role } = useOfficer();
  const [f, setF] = useState<ReportFilters>(DEFAULT_FILTERS);
  const allowed = reportsForRole(role).some((r) => r.id === reportId);
  const id = reportId as ReportId;
  const { data } = useAsync(
    () => (allowed ? getReport(id, f, settings, role) : Promise.resolve(null)),
    [id, f, settings, role, allowed],
  );

  if (!allowed)
    return (
      <AgencyPage title={t("agency.page.report")}>
        <Card>
          <EmptyState title={t("rp.notForRole")} />
        </Card>
      </AgencyPage>
    );

  const cell = (c: Cell) =>
    typeof c === "object" ? lt(c) : typeof c === "number" ? formatNumber(c) : c;
  const xLabel = (m: string) =>
    /^\d{4}-\d{2}$/.test(m) ? formatDate(`${m}-01`, lang, "mon") : m;
  const chartData: Record<string, string | number>[] =
    data?.chart.data.map((d) => ({ ...d, month: xLabel(String(d.month)) })) ??
    [];
  const pct = data?.chart.format === "percent";

  const exportCsv = () => {
    if (!data) return;
    const esc = (v: string) =>
      /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    const lines = [
      data.table.columns.map((c) => esc(t(c))).join(","),
      ...data.table.rows.map((r) =>
        r.map((c) => esc(typeof c === "object" ? lt(c) : String(c))).join(","),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `ptptn-${id}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    logExport(officer, id, "csv");
    toast(t("rp.exported"));
  };

  return (
    <div className="print-area">
      <AgencyPage
        title={t(`rp.${id}.title`)}
        description={t(`rp.${id}.desc`)}
        actions={
          <span className="flex gap-2 print:hidden">
            <Button
              variant="secondary"
              size="sm"
              icon={<FileDown size={14} strokeWidth={1.5} />}
              onClick={exportCsv}
            >
              {t("rp.exportCsv")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Printer size={14} strokeWidth={1.5} />}
              onClick={() => {
                logExport(officer, id, "pdf");
                window.print();
              }}
            >
              {t("rp.exportPdf")}
            </Button>
          </span>
        }
      >
        <Link
          to="/a/reports"
          className="mb-4 inline-flex items-center gap-1.5 t-caption text-ink-2 hover:text-ink print:hidden"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> {t("agency.nav.allReports")}
        </Link>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 print:hidden">
          <Select
            size="sm"
            label={t("st.filter.cohort")}
            value={f.cohort}
            disabled={data?.liveOnly}
            onChange={(e) => setF({ ...f, cohort: e.target.value })}
            options={[
              { value: "all", label: t("rp.f.allCohorts") },
              ...FILTER_OPTIONS.cohorts.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Select
            size="sm"
            label={t("st.filter.institution")}
            value={f.institution}
            disabled={data?.liveOnly}
            onChange={(e) => setF({ ...f, institution: e.target.value })}
            options={[
              { value: "all", label: t("rp.f.allInstitutions") },
              ...FILTER_OPTIONS.institutions.map((c) => ({
                value: c,
                label: c,
              })),
            ]}
          />
          <Select
            size="sm"
            label={t("st.filter.state")}
            value={f.state}
            disabled={data?.liveOnly}
            onChange={(e) => setF({ ...f, state: e.target.value })}
            options={[
              { value: "all", label: t("rp.f.allStates") },
              ...FILTER_OPTIONS.states.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Select
            size="sm"
            label={t("rp.f.period")}
            value={String(f.months)}
            onChange={(e) =>
              setF({
                ...f,
                months: Number(e.target.value) as ReportFilters["months"],
              })
            }
            options={[3, 6, 12].map((m) => ({
              value: String(m),
              label: t("rp.f.months", { n: m }),
            }))}
          />
        </div>
        {data?.liveOnly && (
          <Note tone="muted" className="mb-4">
            {t("rp.liveOnly")}
          </Note>
        )}

        {data && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
              {data.kpis.map((k) => (
                <KpiTile key={k.label} k={k} />
              ))}
            </dl>

            <ChartCard
              title={t(data.chart.title)}
              legend={
                data.chart.kind === "stacked"
                  ? data.chart.series.map((s, i) => ({
                      label: t(s.label),
                      color: SERIES[i],
                    }))
                  : undefined
              }
              chart={
                data.chart.kind === "stacked" ? (
                  <StackedBars
                    data={chartData}
                    x="month"
                    series={data.chart.series.map((s, i) => ({
                      key: s.key,
                      label: t(s.label),
                      color: SERIES[i],
                    }))}
                    height={260}
                  />
                ) : (
                  <TrendChart
                    data={chartData}
                    x="month"
                    y="value"
                    label={t(data.chart.series[0].label)}
                    format={pct ? (v) => `${v}%` : formatNumber}
                    height={260}
                    domain={
                      pct
                        ? [
                            Math.floor(
                              Math.min(
                                ...chartData.map((d) => Number(d.value)),
                              ) - 5,
                            ),
                            100,
                          ]
                        : undefined
                    }
                  />
                )
              }
              table={
                <DataTableView
                  columns={[
                    t("ti.di.month"),
                    ...data.chart.series.map((s) => t(s.label)),
                  ]}
                  rows={chartData.map((d) => [
                    String(d.month),
                    ...data.chart.series.map((s) =>
                      pct ? `${d[s.key]}%` : formatNumber(Number(d[s.key])),
                    ),
                  ])}
                />
              }
            />

            <Card padded={false} className="overflow-hidden">
              <p className="px-5 pb-3 pt-4 t-body-strong">
                {t(data.table.title)}
              </p>
              <Table minWidth={620}>
                <THead>
                  {data.table.columns.map((c, i) => (
                    <Th key={c} className={i > 0 ? "text-right" : undefined}>
                      {t(c)}
                    </Th>
                  ))}
                </THead>
                <tbody>
                  {data.table.rows.map((r, i) => (
                    <Tr key={i}>
                      {r.map((c, j) => (
                        <Td
                          key={j}
                          className={j > 0 ? "tabular text-right" : undefined}
                        >
                          {cell(c)}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
            <p className="t-caption font-normal text-ink-3">
              {t("rp.footnote", { cadence: t(`rp.cadence.${data.cadence}`) })}
            </p>
          </div>
        )}
      </AgencyPage>
    </div>
  );
}

function KpiTile({ k }: { k: Kpi }) {
  const { t } = useT();
  const fmt = (v: number) =>
    k.format === "percent"
      ? `${v.toFixed(1)}%`
      : k.format === "days"
        ? t("rp.days", { n: v })
        : k.format === "hours"
          ? t("pa.hours", { h: v })
          : formatNumber(v);
  const delta =
    k.previous === undefined
      ? null
      : k.format === "percent"
        ? k.value - k.previous
        : k.previous
          ? ((k.value - k.previous) / k.previous) * 100
          : 0;
  const good =
    delta === null ? true : k.better === "up" ? delta >= 0 : delta <= 0;
  const deltaText =
    delta === null
      ? ""
      : k.format === "percent"
        ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pts`
        : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
  return (
    <Card>
      <dt className="t-caption text-ink-2">
        {t(k.label, { n: k.text ?? "" })}
      </dt>
      {/* Large standalone figures use proportional digits (dataviz guidance). */}
      <dd className="mt-1 t-heading">{fmt(k.value)}</dd>
      {delta !== null && (
        <dd className="mt-1">
          <Chip
            tone={delta === 0 ? "muted" : good ? "done" : "attention"}
            size="sm"
          >
            {t("ag.home.vsLast", { delta: deltaText })}
          </Chip>
        </dd>
      )}
    </Card>
  );
}
