import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Eye, MessageSquare, PauseCircle, PlayCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { LevelBar } from '@/components/ui/LevelBar'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { ReasonDialog } from '@/components/agency/ReasonDialog'
import { RepaymentGate } from '@/components/agency/RepaymentGate'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import { logAudit } from '@/services/audit'
import { readDb } from '@/services/db'
import { toEmployerView } from '@/services/profile'
import { addStudentNote, getStudentRecord, messageStudent, revealIdentity, toggleVisibilityPause, triggerRescore } from '@/services/studentsAdmin'
import { AI_VERSIONS, skillById } from '@/services/taxonomy'
import type { ScoredSkill } from '@/types/domain'
import type { StudentSeed } from '@/data/students'
import { AgencyPage } from '../shell/AgencyPage'
import { STAGE_TONE } from '../tones'
import { useOfficer } from '../useOfficer'

type View = 'student' | 'employer'
type Pending = 'reveal' | 'pause' | null
const opened = new Set<string>()

/** Student record: masked by default; student and employer views; skills with explainability; tier badge only. */
export default function StudentRecordPage() {
  const { studentId = '' } = useParams()
  const { t, lt, lang } = useT()
  const toast = useToast()
  const { officer, role, readOnly } = useOfficer()
  const { data, loading } = useAsync(() => getStudentRecord(studentId), [studentId])
  const [view, setView] = useState<View>('student')
  const [revealed, setRevealed] = useState(false)
  const [pending, setPending] = useState<Pending>(null)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const canAct = !readOnly && (role === 'programmeOfficer' || role === 'superAdmin')

  // Opening a record is logged once per officer and record in this session.
  useEffect(() => {
    const key = `${officer.id}:${studentId}`
    if (!data?.row || opened.has(key)) return
    opened.add(key)
    logAudit(officer, 'Opened student record', 'student', data.row.code)
  }, [data?.row, officer, studentId])

  if (!data)
    return (
      <AgencyPage title={t('agency.page.student')}>
        <Card>{!loading && <EmptyState title={t('ag.empty')} />}</Card>
      </AgencyPage>
    )

  const { row, seed } = data
  const repayment = readDb().repayment[studentId]

  return (
    <AgencyPage
      title={`${t('st.col.student')} ${row.code}`}
      description={`${row.institution} · ${row.programme} · ${row.graduationYear}`}
      actions={
        !revealed &&
        !readOnly && (
          <Button variant="secondary" size="sm" icon={<Eye size={14} strokeWidth={1.5} />} onClick={() => setPending('reveal')}>
            {t('st.reveal')}
          </Button>
        )
      }
    >
      <Link to="/a/students" className="mb-4 inline-flex items-center gap-1.5 t-caption text-ink-2 hover:text-ink">
        <ArrowLeft size={14} strokeWidth={1.5} /> {t('agency.nav.directory')}
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {revealed ? (
          <Chip tone="ink">
            {row.name} · {row.icMasked}
          </Chip>
        ) : (
          <Chip tone="muted">{t('st.masked')}</Chip>
        )}
        {revealed && <Chip tone="info" size="sm">{t('st.revealed')}</Chip>}
        <Chip tone={STAGE_TONE[row.stage]}>{t(`st.stage.${row.stage}`)}</Chip>
        <Chip tone={row.tier === 'A' ? 'done' : 'pending'}>
          {t('st.tierBadge')}: {row.tier === 'A' ? t('ti.v.tierA') : t('ti.v.tierB')}
        </Chip>
        {data.paused && <Chip tone="attention">{t('st.paused')}</Chip>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          {seed ? (
            <>
              <SegmentedControl<View>
                ariaLabel={t('agency.page.student')}
                className="w-full max-w-sm"
                value={view}
                onChange={setView}
                options={[
                  { value: 'student', label: t('st.tab.student') },
                  { value: 'employer', label: t('st.tab.employer') },
                ]}
              />
              {view === 'student' ? <SkillsExplain seed={seed} /> : <EmployerPreview seed={seed} />}
            </>
          ) : (
            <Card>
              <Note tone="muted" className="mb-4">
                {t('st.synthetic')}
              </Note>
              <SectionLabel className="mb-3">{t('st.skills')}</SectionLabel>
              <ul className="space-y-3">
                {row.topSkills.map((k) => (
                  <li key={k.skillId} className="flex items-center justify-between gap-4">
                    <span>{lt(skillById(k.skillId)?.name ?? { en: k.skillId })}</span>
                    <LevelBar level={k.level} label={t(`skill.level.${k.level}`)} className="w-40" />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <SectionLabel className="mb-3">{t('st.timeline')}</SectionLabel>
            {data.log.length === 0 && data.invitations.length === 0 ? (
              <p className="t-body-sm text-ink-2">{t('ag.empty')}</p>
            ) : (
              <ol className="space-y-3 border-l border-hairline pl-4">
                {data.invitations.map((i) => (
                  <li key={i.id}>
                    <p className="t-body-sm">{t('st.tl.invitation', { stage: t(`st.tl.stage.${i.stage}`) })}</p>
                    <p className="t-caption font-normal text-ink-3">{formatDate(i.sentAt, lang, 'long')}</p>
                  </li>
                ))}
                {data.log.slice(0, 8).map((e) => (
                  <li key={e.id}>
                    <p className="t-body-sm">
                      {e.role} · {e.company}
                    </p>
                    <p className="t-caption font-normal text-ink-3">
                      {formatDate(e.appliedAt, lang, 'long')} · {t(`st.log.${e.status}`)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <SectionLabel className="mb-3">{t('st.tierBadge')}</SectionLabel>
            <p className="t-body-strong">{row.tier === 'A' ? t('ti.v.tierA') : t('ti.v.tierB')}</p>
            <p className="mt-1 t-caption font-normal text-ink-2">{t('st.tierOnly')}</p>
            <div className="mt-3">
              <RepaymentGate role={role}>
                <Note tone="muted">{t('st.repaymentDetail', { status: repayment ? t(`rep.status.${repayment.status}`) : t('rep.status.goodStanding') })}</Note>
              </RepaymentGate>
            </div>
          </Card>

          {canAct && (
            <Card>
              <SectionLabel className="mb-3">{t('st.actions')}</SectionLabel>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" icon={data.paused ? <PlayCircle size={14} strokeWidth={1.5} /> : <PauseCircle size={14} strokeWidth={1.5} />} onClick={() => setPending('pause')}>
                  {data.paused ? t('st.resume') : t('st.pause')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw size={14} strokeWidth={1.5} />}
                  onClick={async () => {
                    await triggerRescore(officer, studentId)
                    toast(t('st.rescored'))
                  }}
                >
                  {t('st.rescore')}
                </Button>
              </div>
              <p className="mt-3 t-caption font-normal text-ink-3">{t('st.noScoreEdit')}</p>
              {seed && (
                <form
                  className="mt-4 space-y-2"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!message.trim()) return
                    await messageStudent(officer, studentId, message.trim())
                    setMessage('')
                    toast(t('ag.done'))
                  }}
                >
                  <Textarea label={t('st.message')} value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder={t('st.messagePlaceholder')} />
                  <Button type="submit" variant="secondary" size="sm" icon={<MessageSquare size={14} strokeWidth={1.5} />} disabled={!message.trim()}>
                    {t('st.message')}
                  </Button>
                </form>
              )}
            </Card>
          )}

          <Card>
            <SectionLabel className="mb-3">{t('st.notes')}</SectionLabel>
            {canAct && (
              <form
                className="mb-4 space-y-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!note.trim()) return
                  await addStudentNote(officer, studentId, note.trim())
                  setNote('')
                  toast(t('ag.done'))
                }}
              >
                <Textarea label={t('st.addNote')} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                <Button type="submit" variant="secondary" size="sm" disabled={!note.trim()}>
                  {t('st.addNote')}
                </Button>
              </form>
            )}
            {data.notes.length === 0 ? (
              <p className="t-body-sm text-ink-2">{t('st.noNotes')}</p>
            ) : (
              <ul className="space-y-3">
                {data.notes.map((n, i) => (
                  <li key={i}>
                    <p className="t-body-sm">{n.body}</p>
                    <p className="t-caption font-normal text-ink-3">
                      {n.by} · {formatDate(n.at, lang, 'long')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ReasonDialog
        open={!!pending}
        title={pending === 'reveal' ? t('st.revealTitle') : data.paused ? t('st.resume') : t('st.pause')}
        confirmLabel={t('ag.confirm')}
        presets={pending === 'reveal' ? ['Student called the helpline', 'Verifying a flagged account'] : ['Student asked to pause', 'Under investigation']}
        onCancel={() => setPending(null)}
        onConfirm={async (r) => {
          if (pending === 'reveal') {
            revealIdentity(officer, studentId, r)
            setRevealed(true)
          } else {
            await toggleVisibilityPause(officer, studentId, r)
          }
          setPending(null)
          toast(t('ag.done'))
        }}
      />
    </AgencyPage>
  )
}

function SkillsExplain({ seed }: { seed: StudentSeed }) {
  const { t, lt } = useT()
  const skills = seed.skills ?? []
  const source = (k: ScoredSkill) => k.evidenceIds.map((e) => seed.activities.find((a) => a.id === e)?.role ?? seed.evidence.find((x) => x.id === e)?.fileName ?? e)
  if (skills.length === 0)
    return (
      <Card>
        <EmptyState title={t('st.noSkills')} />
      </Card>
    )
  return (
    <Card padded={false} className="divide-y divide-hairline">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
        <SectionLabel>{t('st.skills')}</SectionLabel>
        <span className="t-caption text-ink-3">
          {t('st.explain.versions')}: {AI_VERSIONS.model} · {AI_VERSIONS.rubric}
        </span>
      </div>
      {skills.map((k) => (
        <details key={k.skillId} className="group px-5 py-3">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="t-body-strong">{lt(skillById(k.skillId)?.name ?? { en: k.skillId })}</span>
              {k.status === 'disputed' && <Chip tone="pending" size="sm">{t('st.disputed')}</Chip>}
              {k.status === 'hidden' && <Chip tone="muted" size="sm">{t('st.hiddenByStudent')}</Chip>}
            </span>
            <span className="flex items-center gap-3">
              <span className="t-caption tabular text-ink-3">{k.confidence.toFixed(2)}</span>
              <LevelBar level={k.level} label={t(`skill.level.${k.level}`)} className="w-36" />
            </span>
          </summary>
          <dl className="mt-3 grid gap-3 t-body-sm sm:grid-cols-2">
            <div>
              <dt className="t-caption text-ink-2">{t('st.explain.evidence')}</dt>
              <dd>{source(k).join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="t-caption text-ink-2">{t('st.explain.rule')}</dt>
              <dd>{k.rubricHits.join(' · ') || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="t-caption text-ink-2">{t('sd.aiSays')}</dt>
              <dd>{lt(k.rationale)}</dd>
            </div>
          </dl>
        </details>
      ))}
    </Card>
  )
}

function EmployerPreview({ seed }: { seed: StudentSeed }) {
  const { t, lt } = useT()
  const v = toEmployerView(seed.student, seed.skills ?? [])
  return (
    <Card>
      <p className="t-label text-ink-3">{v.candidateCode}</p>
      <p className="mt-1 t-subheading">{v.headline}</p>
      <p className="text-ink-2">
        {v.institution} · {v.graduationYear} · {v.state}
      </p>
      <p className="mt-3 t-body-sm">{v.summary}</p>
      <ul className="mt-4 space-y-2">
        {v.skills.map((k) => (
          <li key={k.skillId} className="flex items-center justify-between gap-4">
            <span>{lt(skillById(k.skillId)?.name ?? { en: k.skillId })}</span>
            <LevelBar level={k.level} label={t(`skill.level.${k.level}`)} className="w-36" />
          </li>
        ))}
      </ul>
      <p className="mt-4 t-caption font-normal text-ink-3">{t('st.employerNote')}</p>
    </Card>
  )
}
