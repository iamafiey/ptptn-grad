import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, BriefcaseBusiness, Check, EyeOff, FileText, GraduationCap, ImageIcon, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { LevelBar } from '@/components/ui/LevelBar'
import { Sheet } from '@/components/ui/Sheet'
import { IconTile } from '@/components/ui/Tiles'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { useT } from '@/i18n'
import { addEvidenceAndRescore, type EvidenceSampleKind } from '@/services/skillTranslation'
import { hideSkill, lowerSkill, unhideSkill, type StudentState } from '@/services/students'
import { skillById } from '@/services/taxonomy'
import type { RescoreResult, ScoredSkill } from '@/types/domain'
import { DisputeSheet } from './DisputeSheet'
import { statusChip } from './skillHelpers'

type View = 'details' | 'choose' | 'rescoring' | 'result'

/** Every score shows its evidence: level, reason, sources, rubric checks, and the student's actions. */
export function SkillSheet({ state, skill, open, onClose, readOnly }: { state: StudentState; skill: ScoredSkill | null; open: boolean; onClose: () => void; readOnly?: boolean }) {
  const { t, lt } = useT()
  const reduce = useReducedMotion()
  const [view, setView] = useState<View>('details')
  const [result, setResult] = useState<RescoreResult | null>(null)
  const [disputing, setDisputing] = useState(false)
  const id = state.student.id

  const close = () => {
    onClose()
    setTimeout(() => {
      setView('details')
      setResult(null)
    }, 300)
  }
  if (!skill) return null
  const name = lt(skillById(skill.skillId)?.name ?? { en: skill.skillId })
  const chip = statusChip(skill)

  const attach = async (kind: EvidenceSampleKind) => {
    setView('rescoring')
    const r = await addEvidenceAndRescore(id, skill.skillId, kind)
    setResult(r)
    setView('result')
  }

  const sources = skill.evidenceIds.map((eid) => {
    const act = state.activities.find((a) => a.id === eid)
    if (act) return { id: eid, icon: <BriefcaseBusiness size={18} strokeWidth={1.5} />, label: act.role, sub: act.organisation }
    const file = state.evidence.find((e) => e.id === eid)
    if (file) return { id: eid, icon: null, img: file.previewUrl, label: file.fileName, sub: t(file.kind === 'letter' ? 'evidence.letter' : file.kind === 'photo' ? 'evidence.photo' : file.kind === 'transcript' ? 'skillSheet.transcript' : 'evidence.certificate') }
    return { id: eid, icon: <GraduationCap size={18} strokeWidth={1.5} />, label: t('skillSheet.transcript'), sub: state.student.institution }
  })

  const footer =
    readOnly || view !== 'details' ? (
      view === 'result' ? (
        <Button block onClick={close}>
          {t('action.done')}
        </Button>
      ) : undefined
    ) : (
      <Button block icon={<Sparkles size={18} strokeWidth={1.5} />} onClick={() => setView('choose')}>
        {t('skill.action.addEvidence')}
      </Button>
    )

  return (
    <>
      <Sheet open={open} onClose={close} title={name} closeLabel={t('action.close')} footer={footer}>
        {view === 'details' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <LevelBar level={skill.level} label={t(`skill.level.${skill.level}`)} className="flex-1" />
                <span className="t-body-strong">{t(`skill.level.${skill.level}`)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip tone={skill.confidenceLabel === 'high' ? 'done' : skill.confidenceLabel === 'medium' ? 'pending' : 'attention'} size="sm">
                  {t(`skill.confidence.${skill.confidenceLabel}`)} · <span className="tabular">{Math.round(skill.confidence * 100)}%</span>
                </Chip>
                {chip && (
                  <Chip tone={chip.tone} size="sm">
                    {t(chip.key)}
                  </Chip>
                )}
              </div>
            </div>

            <section>
              <p className="mb-1 t-label text-ink-2">{t('skillSheet.why')}</p>
              <p className="t-body">{lt(skill.rationale)}</p>
            </section>

            <section>
              <p className="mb-2 t-label text-ink-2">{t('skillSheet.evidence')}</p>
              {sources.length === 0 ? (
                <p className="t-body text-ink-2">{t('skillSheet.noEvidence')}</p>
              ) : (
                <ul className="space-y-2">
                  {sources.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 rounded-control bg-surface-muted p-2">
                      {'img' in s && s.img ? (
                        <img src={s.img} alt="" className="h-12 w-12 shrink-0 rounded-chip border border-hairline bg-surface object-cover object-top" />
                      ) : (
                        <IconTile className="bg-surface">{s.icon}</IconTile>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate t-body-strong">{s.label}</span>
                        <span className="block truncate t-caption font-normal text-ink-2">{s.sub}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {skill.rubricHits.length > 0 && (
              <section>
                <p className="mb-2 t-label text-ink-2">{t('skillSheet.rubric')}</p>
                <ul className="space-y-1.5">
                  {skill.rubricHits.map((h) => (
                    <li key={h} className="flex items-center gap-2 t-body">
                      <Check size={16} strokeWidth={2} className="text-ink-2" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!readOnly && (
              <section className="space-y-3 border-t border-hairline pt-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" disabled={skill.level === 'foundation'} onClick={() => lowerSkill(id, skill.skillId)}>
                    {t('skill.action.lower')}
                  </Button>
                  {skill.status === 'hidden' ? (
                    <Button variant="secondary" size="sm" onClick={() => unhideSkill(id, skill.skillId)}>
                      {t('skill.action.unhide')}
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" icon={<EyeOff size={14} strokeWidth={1.5} />} disabled={skill.status === 'disputed'} onClick={() => hideSkill(id, skill.skillId)}>
                      {t('skill.action.hide')}
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" disabled={skill.status === 'disputed'} onClick={() => setDisputing(true)}>
                    {t('skill.action.dispute')}
                  </Button>
                </div>
                <p className="t-caption font-normal text-ink-3">{t('skillSheet.lowerNote')}</p>
              </section>
            )}
          </div>
        )}

        {view === 'choose' && (
          <div className="space-y-3">
            <p className="t-body text-ink-2">{t('skillSheet.addEvidenceTitle')}</p>
            {(
              [
                ['certificate', <FileText key="c" size={20} strokeWidth={1.5} />],
                ['letter', <Mail key="l" size={20} strokeWidth={1.5} />],
                ['photo', <ImageIcon key="p" size={20} strokeWidth={1.5} />],
              ] as const
            ).map(([k, icon]) => (
              <button key={k} onClick={() => attach(k)} className="flex w-full items-center gap-3 rounded-control border border-hairline bg-surface p-3 text-left hover:bg-surface-muted">
                <IconTile>{icon}</IconTile>
                <span className="flex-1 t-body-strong">{t(`evidence.${k}`)}</span>
                <ArrowRight size={18} strokeWidth={1.5} className="text-ink-3" aria-hidden />
              </button>
            ))}
          </div>
        )}

        {view === 'rescoring' && (
          <div className="py-10 text-center">
            <motion.div
              className="mx-auto h-1.5 w-40 overflow-hidden rounded-sm bg-hairline"
              aria-hidden
            >
              <motion.div className="h-full w-1/3 bg-ink" animate={reduce ? { opacity: [0.4, 1] } : { x: ['-100%', '300%'] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }} />
            </motion.div>
            <p className="mt-4 t-body text-ink-2" role="status">
              {t('skillSheet.rescoring')}
            </p>
          </div>
        )}

        {view === 'result' && result && (
          <div className="space-y-4">
            <Card className="bg-surface-muted shadow-none">
              <p className="t-heading" role="status">
                {t('skillSheet.rescored', { skill: name, from: t(`skill.level.${result.from}`), to: t(`skill.level.${result.to}`) })}
              </p>
              <LevelBar level={result.to} label={t(`skill.level.${result.to}`)} className="mt-3" />
              <p className="mt-3 t-body text-ink-2">{lt(result.reason)}</p>
            </Card>
            {result.newMatches > 0 && (
              <Chip tone="done">
                <AnimatedNumber value={result.newMatches} from={0} />
                &nbsp;{t('skillSheet.newMatches', { count: result.newMatches }).replace(/^\d+\s/, '')}
              </Chip>
            )}
          </div>
        )}
      </Sheet>
      <DisputeSheet studentId={id} skillId={skill.skillId} skillName={name} open={disputing} onClose={() => setDisputing(false)} />
    </>
  )
}
