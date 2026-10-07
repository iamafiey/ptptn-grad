import type { I18nKey } from './en'

// Bahasa Melayu. Missing keys fall back to English (see useT).
export const ms: Partial<Record<I18nKey, string>> = {
  'app.name': 'PTPTN Graduan',

  'nav.home': 'Utama',
  'nav.profile': 'Profil',
  'nav.opportunities': 'Peluang',
  'nav.learn': 'Belajar',
  'nav.repayment': 'Bayaran Balik',
  'nav.notifications': 'Notifikasi',
  'nav.settings': 'Tetapan',

  'action.continue': 'Teruskan',
  'action.cancel': 'Batal',
  'action.close': 'Tutup',
  'action.viewAll': 'Lihat semua',
  'action.logApplication': 'Rekod permohonan',
  'action.expressInterest': 'Nyatakan minat',
  'action.reply': 'Balas',
  'action.reupload': 'Muat naik semula',
  'action.closeGap': 'Tutup jurang ini',
  'action.uploadEvidence': 'Muat naik bukti',
  'action.useSample': 'Guna fail contoh',

  'status.verified': 'Disahkan',
  'status.underReview': 'Dalam semakan',
  'status.rejected': 'Perlu muat naik semula',
  'status.pending': 'Belum selesai',
  'status.invitationWaiting': 'Jemputan menunggu',
  'status.benefitsPaused': 'Manfaat digantung',
  'status.gracePeriod': 'Tempoh tangguh',
  'status.goodStanding': 'Kedudukan baik',
  'status.live': 'Aktif',
  'status.talentPartner': 'Rakan Bakat',

  'skill.level.foundation': 'Asas',
  'skill.level.working': 'Mahir',
  'skill.level.advanced': 'Lanjutan',
  'skill.evidence_one': '{count} bukti',
  'skill.evidence_other': '{count} bukti',
  'skill.confidence.high': 'Keyakinan tinggi',
  'skill.confidence.medium': 'Keyakinan sederhana',
  'skill.confidence.low': 'Keyakinan rendah',

  'role.match': '{pct}% padanan',
  'role.matchShort': 'padanan',
  'role.unlockWithGoodStanding': 'Buka dengan kedudukan baik',
  'role.whyYouMatch': 'Mengapa anda sepadan',

  'home.nextStep.label': 'Langkah seterusnya',

  'empty.jobLog.title': 'Belum ada permohonan direkodkan.',
  'empty.jobLog.body': 'Sudah memohon di mana-mana? Rekodkan dan ia dikira.',

  'settings.language': 'Bahasa',
  'settings.language.en': 'English',
  'settings.language.ms': 'Bahasa Melayu',
}
