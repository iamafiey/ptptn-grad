// English source dictionary. Every user-facing string lives here; ms.ts mirrors these keys.
// Keys are namespaced by area. Use {name} for interpolation and _one/_other suffixes for plurals.
export const en = {
  'app.name': 'PTPTN Graduate',

  // Navigation
  'nav.home': 'Home',
  'nav.profile': 'Profile',
  'nav.opportunities': 'Opportunities',
  'nav.learn': 'Learn',
  'nav.repayment': 'Repayment',
  'nav.notifications': 'Notifications',
  'nav.settings': 'Settings',

  // Common actions
  'action.continue': 'Continue',
  'action.cancel': 'Cancel',
  'action.close': 'Close',
  'action.viewAll': 'View all',
  'action.logApplication': 'Log an application',
  'action.expressInterest': 'Express interest',
  'action.reply': 'Reply',
  'action.reupload': 'Re-upload',
  'action.closeGap': 'Close this gap',
  'action.uploadEvidence': 'Upload evidence',
  'action.useSample': 'Use a sample file',

  // Status chips
  'status.verified': 'Verified',
  'status.underReview': 'Under review',
  'status.rejected': 'Needs re-upload',
  'status.pending': 'Pending',
  'status.invitationWaiting': 'Invitation waiting',
  'status.benefitsPaused': 'Benefits paused',
  'status.gracePeriod': 'Grace period',
  'status.goodStanding': 'Good standing',
  'status.live': 'Live',
  'status.talentPartner': 'Talent Partner',

  // Skills
  'skill.level.foundation': 'Foundation',
  'skill.level.working': 'Working',
  'skill.level.advanced': 'Advanced',
  'skill.evidence_one': '{count} evidence',
  'skill.evidence_other': '{count} evidence',
  'skill.confidence.high': 'High confidence',
  'skill.confidence.medium': 'Medium confidence',
  'skill.confidence.low': 'Low confidence',

  // Roles & jobs
  'role.match': '{pct}% match',
  'role.matchShort': 'match',
  'role.unlockWithGoodStanding': 'Unlock with good standing',
  'role.whyYouMatch': 'Why you match',

  // Home
  'home.nextStep.label': 'Your next step',

  // Empty states
  'empty.jobLog.title': 'No applications logged yet.',
  'empty.jobLog.body': 'Applied somewhere? Log it and it counts.',

  // Settings
  'settings.language': 'Language',
  'settings.language.en': 'English',
  'settings.language.ms': 'Bahasa Melayu',
} as const

export type I18nKey = keyof typeof en
