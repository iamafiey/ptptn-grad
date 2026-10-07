import { useState } from 'react'
import { Bell, Eye, Languages, ShieldCheck } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Toggle } from '@/components/ui/Field'
import { ListRow } from '@/components/ui/ListRow'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Avatar } from '@/components/ui/Rings'
import { useT } from '@/i18n'
import { getPersona } from '@/services/demo'
import { useDemo } from '@/state/DemoProvider'
import type { Lang } from '@/types/domain'

/** Settings live under the avatar: language, visibility, notifications, data and privacy. */
export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang, setLang } = useT()
  const { personaId } = useDemo()
  const persona = getPersona(personaId)
  // Visibility is wired to the student record in Phase 2; local for now.
  const [visible, setVisible] = useState(true)

  return (
    <Sheet open={open} onClose={onClose} title={t('settings.title')} closeLabel={t('action.close')}>
      <div className="flex items-center gap-4">
        <Avatar initials={persona.initials} strength={persona.profileStrength} size={64} label={t('settings.profileStrength', { pct: persona.profileStrength })} />
        <div className="min-w-0">
          <p className="t-subheading">{persona.fullName}</p>
          <p className="t-caption font-normal text-ink-2">
            {persona.institution} · {t('settings.profileStrength', { pct: persona.profileStrength })}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-1 divide-y divide-hairline">
        <div className="pb-4">
          <div className="mb-3 flex items-center gap-3">
            <Languages size={20} strokeWidth={1.5} className="text-ink-2" aria-hidden />
            <span className="t-body-strong">{t('settings.language')}</span>
          </div>
          <SegmentedControl<Lang>
            ariaLabel={t('settings.language')}
            value={lang}
            onChange={setLang}
            options={[
              { value: 'en', label: t('settings.language.en') },
              { value: 'ms', label: t('settings.language.ms') },
            ]}
          />
        </div>
        <div className="py-4">
          <div className="flex items-start gap-3">
            <Eye size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-2" aria-hidden />
            <div className="flex-1">
              <Toggle checked={visible} onChange={setVisible} label={t('settings.visibility')} description={t('settings.visibility.desc')} />
            </div>
          </div>
        </div>
        <div className="pt-2">
          <ListRow icon={<Bell size={20} strokeWidth={1.5} />} label={t('settings.notifications')} description={t('settings.notifications.desc')} onClick={() => {}} />
          <ListRow icon={<ShieldCheck size={20} strokeWidth={1.5} />} label={t('settings.privacy')} description={t('settings.privacy.desc')} onClick={() => {}} />
        </div>
      </div>
    </Sheet>
  )
}
