import { useState } from 'react'
import { AlertTriangle, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Toggle } from '@/components/ui/Field'
import { Note } from '@/components/ui/Note'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { ReasonDialog } from '@/components/agency/ReasonDialog'
import { useAsync } from '@/hooks/useAsync'
import { useT } from '@/i18n'
import { formatDate } from '@/lib/format'
import { getSafety, resolveChatFlag, sendScamNotice, setOutreachPaused } from '@/services/settingsAdmin'
import type { Officer } from '@/types/domain'

/** Safety: outreach kill switch, bulk scam notice, keyword monitor on partner chats. */
export function SafetyTab({ officer, canEdit }: { officer: Officer; canEdit: boolean }) {
  const { t, lang } = useT()
  const toast = useToast()
  const { data } = useAsync(() => getSafety(), [])
  const [confirming, setConfirming] = useState(false)
  const [notice, setNotice] = useState(t('se.safety.noticeDefault'))
  const paused = !!data?.outreachPaused

  return (
    <div className="space-y-4">
      <Card>
        <Toggle checked={paused} onChange={() => canEdit && setConfirming(true)} label={t('se.safety.kill')} description={paused ? t('se.safety.killOn') : t('se.safety.killOff')} />
        {paused && (
          <Note tone="attention" icon={<AlertTriangle size={14} strokeWidth={1.5} />} className="mt-3">
            {t('se.safety.killNote')}
          </Note>
        )}
      </Card>

      <Card>
        <SectionLabel className="mb-3">{t('se.safety.notice')}</SectionLabel>
        <Textarea label={t('se.safety.noticeLabel')} value={notice} onChange={(e) => setNotice(e.target.value)} rows={3} disabled={!canEdit} />
        {canEdit && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              icon={<Megaphone size={14} strokeWidth={1.5} />}
              disabled={!notice.trim()}
              onClick={async () => {
                await sendScamNotice(officer, notice.trim() === t('se.safety.noticeDefault') ? undefined : notice.trim())
                toast(t('se.safety.sent'))
              }}
            >
              {t('se.safety.send')}
            </Button>
          </div>
        )}
      </Card>

      <Card padded={false}>
        <SectionLabel className="px-5 pb-3 pt-5">{t('se.safety.keywords')}</SectionLabel>
        {(data?.chatFlags ?? []).length === 0 ? (
          <p className="px-5 pb-5 t-body-sm text-ink-2">{t('ag.empty')}</p>
        ) : (
          <ul className="divide-y divide-hairline border-t border-hairline">
            {data!.chatFlags.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="t-body-strong">
                    {f.partner} · <span className="text-attention-ink">“{f.keyword}”</span>
                  </p>
                  <p className="t-body-sm text-ink-2">{f.excerpt}</p>
                  <p className="t-caption font-normal text-ink-3">
                    {f.id} · {formatDate(f.at, lang, 'long')}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button variant="tertiary" size="sm" onClick={() => resolveChatFlag(officer, f.id, 'dismissed')}>
                      {t('se.safety.dismiss')}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => resolveChatFlag(officer, f.id, 'escalated')}>
                      {t('se.safety.escalate')}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ReasonDialog
        open={confirming}
        title={paused ? t('se.safety.resume') : t('se.safety.kill')}
        confirmLabel={t('ag.confirm')}
        presets={paused ? ['Investigation closed'] : ['Scam reports from several students', 'Partner chat security review']}
        onCancel={() => setConfirming(false)}
        onConfirm={async (r) => {
          await setOutreachPaused(officer, !paused, r)
          setConfirming(false)
          toast(t('ag.done'))
        }}
      />
    </div>
  )
}

