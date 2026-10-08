import { ShieldCheck } from 'lucide-react'
import { Avatar } from '@/components/ui/Rings'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Table, THead, Th, Td, Tr } from '@/components/agency/Table'
import { useT } from '@/i18n'
import { listOfficers } from '@/services/demo'
import { AGENCY_SECTIONS, canSee } from '../nav'

/** Roles and access: who sees which sections; access policy. */
export function RolesTab() {
  const { t } = useT()
  return (
    <div className="space-y-4">
      <Card padded={false} className="overflow-hidden">
        <Table minWidth={760}>
          <THead>
            <Th>{t('se.roles.officer')}</Th>
            <Th>{t('se.roles.role')}</Th>
            <Th>{t('se.roles.sections')}</Th>
          </THead>
          <tbody>
            {listOfficers().map((o) => (
              <Tr key={o.id}>
                <Td>
                  <span className="flex items-center gap-3">
                    <Avatar initials={o.initials} size={28} />
                    {o.name}
                  </span>
                </Td>
                <Td className="whitespace-nowrap">{t(`agency.role.${o.role}`)}</Td>
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {AGENCY_SECTIONS.filter((s) => canSee(s, o.role)).map((s) => (
                      <Chip key={s.id} tone="muted" size="sm">
                        {t(s.label)}
                      </Chip>
                    ))}
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <Card>
        <SectionLabel className="mb-3">{t('se.roles.policy')}</SectionLabel>
        <ul className="space-y-2">
          {(['twoFactor', 'timeout', 'reauth', 'leastData'] as const).map((k) => (
            <li key={k} className="flex items-start gap-2 t-body-sm">
              <ShieldCheck size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-done-ink" aria-hidden />
              {t(`se.roles.p.${k}`)}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
