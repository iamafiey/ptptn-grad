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

  // Greeting
  'greeting.morning': 'Good morning',
  'greeting.afternoon': 'Good afternoon',
  'greeting.evening': 'Good evening',
  'greeting.hi': 'Hi, <em>{name}</em>',

  // Demo controls (role toggle, persona, reset)
  'demo.button': 'Demo',
  'demo.title': 'Demo controls',
  'demo.workspace': 'Workspace',
  'demo.workspace.student': 'Student',
  'demo.workspace.agency': 'Agency',
  'demo.persona': 'Demo student',
  'demo.officerRole': 'Officer role',
  'demo.reset': 'Reset demo',
  'demo.reset.done': 'Demo data reset',
  'demo.note': 'Prototype with fictional data. Nothing here is saved.',

  // Student settings sheet (under the avatar)
  'settings.title': 'Settings',
  'settings.visibility': 'Let Talent Partners find me',
  'settings.visibility.desc': 'Turning this off pauses discovery without deleting your profile.',
  'settings.notifications': 'Notifications',
  'settings.notifications.desc': 'Push, WhatsApp/SMS and email',
  'settings.privacy': 'Data and privacy',
  'settings.privacy.desc': 'Consent record, download or delete your data',
  'settings.profileStrength': 'Profile strength {pct}%',

  // Student page titles
  'student.home.title': 'Home',
  'student.profile.title': 'Your profile',
  'student.cv.title': 'Skill CV',
  'student.opportunities.title': 'Opportunities',
  'student.learn.title': 'Learn',
  'student.gap.title': 'Close a skill gap',
  'student.repayment.title': 'Repayment',
  'student.notifications.title': 'Notifications',
  'student.openSettings': 'Open settings',

  // Onboarding
  'onboarding.step': 'Step {n} of {total}',
  'onboarding.back': 'Back',
  'onboarding.signin.title': 'Sign in',
  'onboarding.consent.title': 'Your data, your say',
  'onboarding.confirm.title': 'Confirm what we found',
  'onboarding.academic.title': 'Add your academic record',
  'onboarding.activities.title': 'Tell us about campus life',
  'onboarding.preferences.title': 'Job preferences',
  'onboarding.translating.title': 'Translating your skills',
  'onboarding.reveal.title': 'Your skills, revealed',
  'onboarding.review.title': 'Review and confirm',
  'onboarding.visible.title': 'Go visible',

  // Placeholders (Phase 1b only)
  'placeholder.phase': 'Built in Phase {n}',
  'placeholder.next': 'Next step',
  'placeholder.finish': 'Finish onboarding',

  // Agency
  'agency.name': 'PTPTN Agency',
  'agency.search': 'Search student, partner or case ID',
  'agency.language': 'BM / EN',
  'agency.signedInAs': 'Signed in as',
  'agency.noAccess.title': 'Not available for your role',
  'agency.noAccess.body': 'This section is limited to other roles. Switch officer role from the header to explore it.',
  'agency.readOnly': 'Read-only',

  'agency.role.superAdmin': 'Super admin',
  'agency.role.programmeOfficer': 'Programme officer',
  'agency.role.partnershipManager': 'Partnership manager',
  'agency.role.aiGovernanceLead': 'AI governance lead',
  'agency.role.learningManager': 'Learning manager',
  'agency.role.collectionLiaison': 'Collection liaison',
  'agency.role.leadershipViewer': 'Leadership viewer',

  'agency.nav.home': 'Home',
  'agency.nav.jobSearch': 'Job search',
  'agency.nav.evidenceQueue': 'Evidence queue',
  'agency.nav.evidenceMonitor': 'Evidence monitor',
  'agency.nav.placements': 'Placements',
  'agency.nav.partners': 'Partners',
  'agency.nav.talentPartners': 'Talent Partners',
  'agency.nav.roleApprovals': 'Role approvals',
  'agency.nav.portalFeeds': 'Portal feeds',
  'agency.nav.matching': 'Matching monitor',
  'agency.nav.students': 'Students',
  'agency.nav.directory': 'Directory',
  'agency.nav.disputes': 'Skill disputes',
  'agency.nav.flags': 'Flagged accounts',
  'agency.nav.learn': 'Learn',
  'agency.nav.ai': 'AI governance',
  'agency.nav.taxonomy': 'Taxonomy',
  'agency.nav.rubric': 'Rubric changes',
  'agency.nav.evidenceRules': 'Evidence rules',
  'agency.nav.quality': 'Quality and fairness',
  'agency.nav.tiers': 'Repayment tiers',
  'agency.nav.tierRules': 'Tier rules',
  'agency.nav.sync': 'Sync monitor',
  'agency.nav.overrides': 'Overrides',
  'agency.nav.distribution': 'Distribution',
  'agency.nav.reports': 'Reports',
  'agency.nav.allReports': 'All reports',
  'agency.nav.cohort': 'Cohort view',
  'agency.nav.settings': 'Settings',

  'agency.page.queue': 'Queue',
  'agency.page.partner': 'Partner record',
  'agency.page.student': 'Student record',
  'agency.page.report': 'Report',
  'agency.page.home': 'Command centre',
} as const

export type I18nKey = keyof typeof en
