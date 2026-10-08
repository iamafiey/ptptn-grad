import { useState } from 'react'
import { Download, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LevelBar } from '@/components/ui/LevelBar'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n'
import { employerVisibleSkills, toEmployerView } from '@/services/profile'
import { listCategories, skillById } from '@/services/taxonomy'
import { StudentPage } from '../shell/StudentPage'
import { useStudent } from '../useStudent'

/** Skill CV: printable (Download PDF via the print dialog) and shareable; named or anonymised. */
export default function CvPage() {
  const { t, lt } = useT()
  const toast = useToast()
  const { data } = useStudent()
  const [mode, setMode] = useState<'named' | 'anon'>('named')
  if (!data) return <StudentPage title={t('student.cv.title')}>{null}</StudentPage>

  const s = data.student
  const skills = employerVisibleSkills(data.skills ?? [])
  const anon = toEmployerView(s, data.skills ?? [])
  const name = mode === 'named' ? s.fullName : anon.candidateCode
  const summary = mode === 'named' ? lt(s.summary) : anon.summary

  return (
    <StudentPage title={t('student.cv.title')}>
      <div className="no-print space-y-3">
        <SegmentedControl
          ariaLabel={t('student.cv.title')}
          value={mode}
          onChange={setMode}
          options={[
            { value: 'named', label: t('cv.named') },
            { value: 'anon', label: t('cv.anonymised') },
          ]}
        />
      </div>

      <article className="print-area rounded-card border border-hairline bg-surface p-6 shadow-1">
        <header className="border-b border-hairline pb-4">
          <h2 className="t-title">{name}</h2>
          <p className="mt-1 t-body">{s.programme}</p>
          <p className="t-caption font-normal text-ink-2">
            {s.institution} · {s.graduationYear} · {s.state}
          </p>
        </header>
        {summary && <p className="mt-4 t-body">{summary}</p>}
        <section className="mt-5">
          <p className="mb-3 t-label text-ink-2">{t('cv.skillsBy')}</p>
          <div className="space-y-4">
            {listCategories().map((c) => {
              const inCat = skills.filter((x) => skillById(x.skillId)?.categoryId === c.id)
              if (!inCat.length) return null
              return (
                <div key={c.id}>
                  <p className="mb-1.5 t-caption text-ink-2">{lt(c.name)}</p>
                  <ul className="space-y-2">
                    {inCat.map((x) => (
                      <li key={x.skillId}>
                        <div className="flex items-center gap-3">
                          <span className="min-w-0 flex-1 t-body-strong">{lt(skillById(x.skillId)!.name)}</span>
                          <LevelBar level={x.level} label={t(`skill.level.${x.level}`)} className="w-14" />
                          <span className="w-20 text-right t-caption text-ink-2">{t(`skill.level.${x.level}`)}</span>
                        </div>
                        <p className="t-caption font-normal text-ink-2">{lt(x.rationale)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>
        <footer className="mt-6 border-t border-hairline pt-3 t-micro text-ink-3">{t('cv.footer')}</footer>
      </article>

      <div className="no-print space-y-2">
        <Button block icon={<Download size={18} strokeWidth={1.5} />} onClick={() => window.print()}>
          {t('cv.print')}
        </Button>
        <Button
          block
          variant="secondary"
          icon={<Link2 size={18} strokeWidth={1.5} />}
          onClick={() => {
            const link = `${window.location.origin}${import.meta.env.BASE_URL}cv/${s.id}-${mode === 'anon' ? 'a' : 'n'}`
            navigator.clipboard?.writeText(link).catch(() => {})
            toast(t('cv.copied'))
          }}
        >
          {t('cv.copyLink')}
        </Button>
      </div>
    </StudentPage>
  )
}
