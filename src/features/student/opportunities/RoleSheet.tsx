import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, Check, EyeOff, Lock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { MatchRing } from '@/components/ui/Rings'
import { Note } from '@/components/ui/Note'
import { Sheet } from '@/components/ui/Sheet'
import { Textarea } from '@/components/ui/Textarea'
import { LogoTile } from '@/components/ui/Tiles'
import { useToast } from '@/components/ui/Toast'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { formatDate, formatRMRange } from '@/lib/format'
import { acceptInvitation, askQuestion, declineInvitation, expressInterest, type PartnerRoleView } from '@/services/partners'
import { skillById } from '@/services/taxonomy'
import type { DeclineReason, InvitationStage } from '@/types/domain'

const STAGES: InvitationStage[] = ['invited', 'talking', 'interview', 'offer', 'hired']
const REASONS: DeclineReason[] = ['salary', 'location', 'roleFit', 'timing', 'skillGap', 'other']

type Mode = 'details' | 'share' | 'ask' | 'decline'

/** Partner role detail with the invitation pipeline and the student's three choices. */
export function RoleSheet({ view, studentId, open, onClose }: { view: PartnerRoleView | null; studentId: string; open: boolean; onClose: () => void }) {
  const { t, lt, lang } = useT()
  const toast = useToast()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('details')
  const [question, setQuestion] = useState('')
  const [reasons, setReasons] = useState<DeclineReason[]>([])
  const [busy, setBusy] = useState(false)

  const close = () => {
    onClose()
    setTimeout(() => {
      setMode('details')
      setQuestion('')
      setReasons([])
    }, 300)
  }
  if (!view) return null
  const { role, partner, invitation: inv, access } = view
  const name = (id: string) => lt(skillById(id)?.name ?? { en: id })
  const run = async (fn: () => Promise<unknown>, msg?: string) => {
    setBusy(true)
    await fn()
    setBusy(false)
    setMode('details')
    if (msg) toast(msg)
  }

  // Locked: show only the lock and the way to unlock. No repayment details here.
  if (access === 'locked') {
    return (
      <Sheet
        open={open}
        onClose={close}
        title={t('role.unlockTitle')}
        closeLabel={t('action.close')}
        footer={
          <Button block icon={<Lock size={16} strokeWidth={1.5} />} onClick={() => navigate('/s/repayment')}>
            {t('role.unlockAction')}
          </Button>
        }
      >
        <p className="t-body text-ink-2">{t('role.unlockBody')}</p>
      </Sheet>
    )
  }

  const stageIdx = inv ? STAGES.indexOf(inv.stage) : -1
  let footer: React.ReactNode
  if (mode === 'share')
    footer = (
      <Button block loading={busy} onClick={() => run(() => acceptInvitation(inv!.id), t('role.accepted', { partner: partner.name }))}>
        {t('role.shareConfirm')}
      </Button>
    )
  else if (mode === 'ask')
    footer = (
      <Button block loading={busy} disabled={question.trim().length < 5} onClick={() => run(() => askQuestion(inv!.id, question.trim()))}>
        {t('role.askSend')}
      </Button>
    )
  else if (mode === 'decline')
    footer = (
      <Button block loading={busy} disabled={!reasons.length} onClick={() => run(() => declineInvitation(inv!.id, reasons), t('role.declined'))}>
        {t('role.declineConfirm')}
      </Button>
    )
  else if (inv?.stage === 'invited')
    footer = (
      <div className="space-y-2">
        <Button block onClick={() => setMode('share')}>
          {t('role.accept')}
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setMode('ask')}>
            {t('role.ask')}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setMode('decline')}>
            {t('role.decline')}
          </Button>
        </div>
      </div>
    )
  else if (inv && inv.stage !== 'declined')
    footer = (
      <Button block onClick={() => setMode('ask')}>
        {t('role.ask')}
      </Button>
    )
  else if (!inv)
    footer = (
      <Button block loading={busy} onClick={() => run(() => expressInterest(studentId, role.id), t('role.interestSent', { days: 3 }))}>
        {t('action.expressInterest')}
      </Button>
    )

  return (
    <Sheet open={open} onClose={close} title={role.title} closeLabel={t('action.close')} footer={footer}>
      {mode === 'details' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <LogoTile monogram={partner.monogram} />
            <div className="min-w-0 flex-1">
              <p className="t-body-strong">{partner.name}</p>
              <p className="t-caption font-normal text-ink-2">{partner.sector}</p>
            </div>
            <MatchRing pct={view.matchPct} label={t('role.match', { pct: view.matchPct })} />
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-control bg-surface-muted p-3">
              <dt className="t-caption text-ink-2">{t('role.salary')}</dt>
              <dd className="t-body-strong tabular">{formatRMRange(role.salaryRM)}</dd>
            </div>
            <div className="rounded-control bg-surface-muted p-3">
              <dt className="t-caption text-ink-2">{t('role.location')}</dt>
              <dd className="flex items-center gap-1 t-body-strong">
                <MapPin size={14} strokeWidth={1.5} aria-hidden /> {role.location}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="ink" size="sm">
              {t('status.talentPartner')}
            </Chip>
            <Chip tone="muted" size="sm">
              {t(`role.contract.${role.contractType}`)}
            </Chip>
            <Chip tone="muted" size="sm">
              {t(`role.workMode.${role.workMode}`)}
            </Chip>
            <Chip tone="outline" size="sm">
              {t('role.closes', { date: formatDate(role.closesAt, lang) })}
            </Chip>
            {inv?.stage === 'invited' && (
              <Chip tone="pending" size="sm">
                {t('role.replyBy', { date: formatDate(inv.replyBy, lang, 'weekday') })}
              </Chip>
            )}
          </div>

          {inv && inv.stage !== 'declined' && (
            <section>
              <p className="mb-2 t-label text-ink-2">{t('role.pipeline')}</p>
              <ol className="flex items-center gap-1" aria-label={t('role.pipeline')}>
                {STAGES.map((s, i) => (
                  <li key={s} className="flex-1">
                    <span className={cn('block h-1.5 rounded-sm', i <= stageIdx ? 'bg-ink' : 'bg-hairline')} />
                    <span className={cn('mt-1 block truncate t-micro', i === stageIdx ? 'text-ink' : 'text-ink-3')} aria-current={i === stageIdx ? 'step' : undefined}>
                      {t(`role.stage.${s}` as 'role.stage.invited')}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-2 t-caption font-normal text-ink-3">{t('role.partnerConfirmsHire')}</p>
            </section>
          )}

          <section>
            <p className="mb-2 t-label text-ink-2">{t('role.whyYouMatch')}</p>
            <ul className="space-y-2">
              {view.detail.map((d) => (
                <li key={d.skillId} className="flex items-center gap-3 rounded-control border border-hairline p-3">
                  <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-control', d.met ? 'bg-done text-done-ink' : 'bg-surface-muted text-ink-3')}>
                    {d.met ? <Check size={16} strokeWidth={2} /> : <ArrowRight size={14} strokeWidth={1.5} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block t-body-strong">{name(d.skillId)}</span>
                    <span className="block t-caption font-normal text-ink-2">{d.met ? t('role.matched') : t('role.missing', { level: t(`skill.level.${d.required}`) })}</span>
                  </span>
                  {!d.met && (
                    <Button variant="tertiary" size="sm" onClick={() => navigate(`/s/learn/gap/${d.skillId}`)}>
                      {t('action.closeGap')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <p className="t-body text-ink-2">{role.description}</p>

          {inv && inv.messages.length > 0 && (
            <section>
              <p className="mb-2 t-label text-ink-2">{t('role.messages')}</p>
              <ul className="space-y-2">
                {inv.messages.map((m, i) => (
                  <li key={i} className={cn('max-w-[85%] rounded-card px-3 py-2 t-body', m.from === 'student' ? 'ml-auto bg-ink text-on-ink' : 'bg-surface-muted')}>
                    {m.body}
                    {m.from === 'student' && m.identityHidden && (
                      <span className="mt-1 flex items-center gap-1 t-micro opacity-80">
                        <EyeOff size={12} strokeWidth={1.5} aria-hidden /> {t('role.identityHidden')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {mode === 'share' && (
        <div className="space-y-4">
          <p className="t-heading">{t('role.shareTitle')}</p>
          <p className="t-body text-ink-2">{t('role.shareBody', { partner: partner.name })}</p>
        </div>
      )}

      {mode === 'ask' && (
        <div className="space-y-4">
          {!inv?.profileShared && <Note icon={<EyeOff size={14} strokeWidth={1.5} />}>{t('role.askBody')}</Note>}
          <Textarea label={t('role.askTitle')} placeholder={t('role.askPlaceholder')} value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} />
        </div>
      )}

      {mode === 'decline' && (
        <div className="space-y-4">
          <p className="t-heading">{t('role.declineTitle')}</p>
          <p className="t-body text-ink-2">{t('role.declineBody')}</p>
          <ChipSelect<DeclineReason> multiple label={t('role.declineTitle')} value={reasons} onChange={setReasons} options={REASONS.map((r) => ({ value: r, label: t(`role.decline.${r}`) }))} />
        </div>
      )}
    </Sheet>
  )
}
