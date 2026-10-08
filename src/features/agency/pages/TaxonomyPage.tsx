import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { getTaxonomy } from '@/services/taxonomy'
import { useDemo } from '@/state/DemoProvider'
import { AgencyPage } from '../shell/AgencyPage'

/** Category → skill tree; the selected skill shows definition, examples, related roles, rubric and evidence weights. */
export default function TaxonomyPage() {
  const { t, lt } = useT()
  const { settings } = useDemo()
  const { data } = useAsync(() => getTaxonomy(), [])
  const [selected, setSelected] = useState('process-improvement')
  const skill = data?.skills.find((s) => s.id === selected) ?? data?.skills[0]

  return (
    <AgencyPage title={t('agency.nav.taxonomy')} description={t('ai.tax.lead')}>
      {data && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip tone="done">{t('ai.tax.version', { v: data.version.version, status: t('ai.cr.status.published') })}</Chip>
          <Chip tone="muted">{t(`ai.tax.source.${settings.taxonomy.source}`)}</Chip>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card padded={false} className="max-h-[640px] overflow-y-auto">
          {(data?.categories ?? []).map((c) => (
            <div key={c.id} className="border-b border-hairline last:border-b-0">
              <p className="px-4 pb-1 pt-3 t-label text-ink-3">{lt(c.name)}</p>
              <ul className="pb-2">
                {data!.skills
                  .filter((s) => s.categoryId === c.id)
                  .map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => setSelected(s.id)}
                        aria-current={s.id === skill?.id}
                        className={cn('w-full px-4 py-1.5 text-left t-body-sm hover:bg-surface-muted', s.id === skill?.id && 'bg-surface-muted t-body-strong')}
                      >
                        {lt(s.name)}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </Card>

        {skill && (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="t-heading">{lt(skill.name)}</h2>
              <Chip tone={skill.demand === 'high' ? 'info' : 'muted'} size="sm">
                {t('ai.tax.demand', { d: t(`ai.tax.d.${skill.demand}`) })}
              </Chip>
            </div>
            <SectionLabel className="mb-1 mt-4">{t('ai.tax.definition')}</SectionLabel>
            <p className="t-body-sm">{lt(skill.definition)}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <SectionLabel className="mb-1">{t('ai.tax.examples')}</SectionLabel>
                <ul className="list-disc pl-5 t-body-sm">
                  {skill.exampleActivities.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
              <div>
                <SectionLabel className="mb-1">{t('ai.tax.related')}</SectionLabel>
                <ul className="list-disc pl-5 t-body-sm">
                  {skill.relatedRoles.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
            <SectionLabel className="mb-2 mt-5">{t('ai.tax.rubric')}</SectionLabel>
            <div className="grid gap-3 md:grid-cols-3">
              {skill.rubric.map((r) => (
                <div key={r.level} className="rounded-control bg-surface-muted p-3">
                  <p className="t-body-strong">{t(`skill.level.${r.level}`)}</p>
                  <ul className="mt-1 space-y-1 t-body-sm text-ink-2">
                    {r.criteria.map((c, i) => (
                      <li key={i}>{lt(c)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <SectionLabel className="mb-2 mt-5">{t('ai.tax.weights')}</SectionLabel>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(['activity', 'certificate', 'transcript', 'reference'] as const).map((k) => (
                <div key={k}>
                  <dt className="t-caption text-ink-2">{t(`ai.tax.w.${k}`)}</dt>
                  <dd className="tabular">{skill.evidenceWeights[k].toFixed(2)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </div>
    </AgencyPage>
  )
}
