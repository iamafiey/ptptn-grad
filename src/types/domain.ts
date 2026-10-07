// Domain types — see BUILD_PLAN.md §4. Shaped like real API payloads so mocks can be swapped later.

// ---------- shared ----------
export type ID = string;
export type ISODate = string;                 // '2026-10-07'
export type Lang = 'en' | 'ms';
export type LocalizedText = { en: string; ms?: string };   // student-facing data content
export type Confidence = number;               // 0..1
export type MoneyRangeRM = { min: number; max: number };
export type MalaysianState =
  | 'Johor' | 'Kedah' | 'Kelantan' | 'Melaka' | 'Negeri Sembilan' | 'Pahang' | 'Perak'
  | 'Perlis' | 'Pulau Pinang' | 'Sabah' | 'Sarawak' | 'Selangor' | 'Terengganu'
  | 'WP Kuala Lumpur' | 'WP Putrajaya' | 'WP Labuan';

// ---------- taxonomy & rubric ----------
export type SkillLevel = 'foundation' | 'working' | 'advanced';
export type SkillCategoryId =
  | 'leadership' | 'communication' | 'operations' | 'digital' | 'business' | 'problemSolving';
export interface SkillCategory { id: SkillCategoryId; name: LocalizedText; }
export interface RubricLevelRule { level: SkillLevel; criteria: LocalizedText[]; minMonths?: number; minScale?: number; requiresVerifiedEvidence?: boolean; }
export interface TaxonomySkill {
  id: ID; categoryId: SkillCategoryId; name: LocalizedText; definition: LocalizedText;
  exampleActivities: string[]; relatedRoles: string[];
  rubric: RubricLevelRule[];                   // 3 entries
  evidenceWeights: { activity: number; certificate: number; transcript: number; reference: number };
  demand: 'high' | 'medium' | 'low';           // for gap insights
}
export interface TaxonomyVersion { version: string; status: 'draft' | 'published'; publishedAt?: ISODate; approvedBy?: ID[]; changeNote: string; }

// ---------- student ----------
export type RepaymentStatus = 'grace' | 'goodStanding' | 'behind';
export type Tier = 'A' | 'B';
export type OnboardingStep =
  | 'signin' | 'consent' | 'confirm' | 'academic' | 'activities' | 'preferences'
  | 'translating' | 'reveal' | 'review' | 'visible' | 'done';
export type JourneyStage = 'onboarding' | 'visible' | 'talking' | 'offer' | 'hired';

export interface Student {
  id: ID; fullName: string; preferredName: string; icMasked: string; avatarInitials: string;
  institution: string; programme: string; graduationYear: number; cgpaBand: string; state: MalaysianState;
  isFinalYear: boolean; onboardingStep: OnboardingStep; stage: JourneyStage;
  consent?: { version: string; agreedAt: ISODate };
  visibility: { partnersCanFind: boolean; pausedReason?: string };
  summary: LocalizedText;                      // AI-written, editable
  preferences: JobPreferences;
  profileStrength: number;                     // 0..100
  lastActive: ISODate;
}
export interface JobPreferences { roleInterests: string[]; states: MalaysianState[]; willingToRelocate: boolean; salaryFloorRM: number; earliestStart: ISODate; }

export type ActivityKind = 'club' | 'partTime' | 'internship' | 'competition' | 'freelance' | 'coursework' | 'fyp';
export interface Activity {
  id: ID; studentId: ID; kind: ActivityKind; organisation: string; role: string;
  startDate: ISODate; endDate?: ISODate; description: string; outcome?: string;
  evidenceIds: ID[]; skillIds: ID[];           // skills this activity produced
}
export interface AcademicRecord { studentId: ID; source: 'upload' | 'integration'; courses: { code: string; name: string; grade: string }[]; finalYearProject?: { title: string; grade: string }; }

export interface EvidenceFile {
  id: ID; kind: 'certificate' | 'letter' | 'photo' | 'transcript' | 'confirmationEmail' | 'screenshot' | 'interviewInvite' | 'offerLetter';
  fileName: string; previewUrl: string;        // /evidence/*.svg or object URL
  uploadedAt: ISODate;
}

// ---------- AI translation (shaped like a real API response) ----------
export interface ExtractedFact { id: ID; sourceId: ID; sourceType: 'activity' | 'transcript' | 'evidence'; role?: string; durationMonths?: number; scale?: string; outcome?: string; }
export interface SkillMapping { factId: ID; skillId: ID; ruleId: string; }
export interface ScoredSkill {
  skillId: ID; level: SkillLevel; confidence: Confidence; confidenceLabel: 'high' | 'medium' | 'low';
  evidenceIds: ID[]; factIds: ID[]; rationale: LocalizedText;
  rubricHits: string[];                         // which rubric criteria fired
  status: 'kept' | 'hidden' | 'disputed' | 'loweredByStudent' | 'studentAdded';
  studentLevelCap?: SkillLevel;                 // student may lower, never raise
}
export interface SkillTranslationResult {
  requestId: ID; studentId: ID; modelVersion: string; rubricVersion: string; taxonomyVersion: string;
  generatedAt: ISODate; durationMs: number;
  facts: ExtractedFact[]; mappings: SkillMapping[]; skills: ScoredSkill[];
  stats: { activitiesRead: number; skillsFound: number };
}
export type TranslationProgressEvent = { stage: 'reading' | 'extracting' | 'mapping' | 'scoring' | 'explaining'; message: LocalizedText; pct: number };
export interface RescoreResult { skillId: ID; from: SkillLevel; to: SkillLevel; newMatches: number; reason: LocalizedText; }

// ---------- partners & roles ----------
export type PartnerStatus = 'onboarding' | 'active' | 'paused' | 'ended';
export interface TalentPartner {
  id: ID; name: string; monogram: string; sector: string; hq: MalaysianState; status: PartnerStatus;
  partnerType: 'GLC' | 'privateLarge' | 'ptptnCorporate';
  agreement: { rolesPerYear: number; salaryFloorRM: number; responseDays: number; signedAt?: ISODate; renewsAt?: ISODate };
  verification: { ssm: Check; domain: Check; hrContacts: Check; agreement: Check };
  onboardingStage: 'outreach' | 'verification' | 'workspace' | 'probation' | 'complete';
  probationEndsAt?: ISODate; seats: number;
  metrics: { rolesPosted: number; invitations: number; acceptanceRate: number; hires: number; avgResponseHours: number; complaints: number };
  notes: Note[];
}
export type Check = 'pass' | 'warn' | 'fail' | 'pending';

export type ContractType = 'permanent' | 'graduateProgramme' | 'contract';
export type PartnerRoleStatus = 'pendingApproval' | 'returned' | 'live' | 'closed';
export interface PartnerRole {
  id: ID; partnerId: ID; title: string; location: MalaysianState; workMode: 'onsite' | 'hybrid' | 'remote';
  salaryRM: MoneyRangeRM; contractType: ContractType; requiredSkills: { skillId: ID; level: SkillLevel }[];
  description: string; postedAt: ISODate; closesAt: ISODate; status: PartnerRoleStatus;
  approval?: { criteria: { salaryFloor: Check; contractType: Check; partnerStanding: Check }; decidedBy?: ID; reason?: string };
}
export type InvitationStage = 'invited' | 'talking' | 'interview' | 'offer' | 'hired' | 'declined' | 'expired';
export interface Invitation {
  id: ID; roleId: ID; studentId: ID; stage: InvitationStage; sentAt: ISODate; replyBy: ISODate;
  matchPct: number; whyYouMatch: { skillId: ID; matched: boolean }[];
  profileShared: boolean;                      // employer sees identity only when true
  messages: { from: 'partner' | 'student'; body: string; at: ISODate; identityHidden: boolean }[];
  declineReasons?: DeclineReason[];
  interview?: { at: string; mode: 'video' | 'inPerson'; location?: string };
}
export type DeclineReason = 'salary' | 'location' | 'roleFit' | 'timing' | 'skillGap' | 'other';

// ---------- portals & open jobs ----------
export interface Portal { id: ID; name: string; monogram: string; agreement: 'activeFeed' | 'linkOutOnly' | 'inDiscussion'; lastSyncAt?: ISODate; listingsImported: number; feedHealth: 'ok' | 'stale' | 'failed'; searchUrlTemplate: string; }
export interface OpenJob { id: ID; portalId: ID; title: string; company: string; location: MalaysianState; salaryRM?: MoneyRangeRM; postedAt: ISODate; skillIds: ID[]; matchPct: number; externalUrl: string; reported?: boolean; }

// ---------- job search log & evidence check ----------
export type LogStatus = 'pendingEvidence' | 'checking' | 'verified' | 'underReview' | 'rejected';
export type LogOutcome = 'applied' | 'interview' | 'offer' | 'hired' | 'closed';
export interface JobLogEntry {
  id: ID; studentId: ID; source: 'portalFeed' | 'portalOther' | 'other'; portalId?: ID; portalName: string;
  role: string; company: string; appliedAt: ISODate; evidenceId?: ID;
  status: LogStatus; outcome: LogOutcome; check?: EvidenceCheckResult; rejectionReason?: LocalizedText;
}
export interface EvidenceCheckResult {
  checkId: ID; modelVersion: string; checkedAt: ISODate; confidence: Confidence;
  extracted: { company?: string; role?: string; portal?: string; date?: ISODate };
  checks: { readable: Check; companyExists: Check; matchesEntry: Check; dateInPeriod: Check; duplicateImage: Check; editedImage: Check };
  decision: 'autoVerified' | 'escalated' | 'rejected';
  reasons: LocalizedText[];
}
export interface MonthlyJobSearchSummary { month: string; logged: number; verified: number; underReview: number; interviews: number; threshold: number; met: boolean; }

// ---------- learning ----------
export type CostType = 'free' | 'subsidised' | 'paid';
export type CourseTierAccess = 'all' | 'tierAFullTierBPreview' | 'tierAOnly';
export interface Provider { id: ID; name: string; monogram: string; rating: number; completionRate: number; flagged?: boolean; }
export interface Course {
  id: ID; providerId: ID; title: LocalizedText; skillIds: ID[]; levelCap: SkillLevel; durationHours: number;
  cost: CostType; costRM?: number; format: 'selfPaced' | 'live' | 'blended'; hosted: boolean;
  certificate: string; tierAccess: CourseTierAccess; status: 'draft' | 'live' | 'paused' | 'retired';
  enrolments: number; completionRate: number;
}
export interface Enrolment { courseId: ID; studentId: ID; status: 'inProgress' | 'completed' | 'external'; progressPct: number; lastActivityAt: ISODate; certificateEvidenceId?: ID; }
export interface SkillGap { skillId: ID; currentLevel: SkillLevel | null; targetLevel: SkillLevel; unlocksMatches: number; courseIds: ID[]; }

// ---------- repayment (student-only + liaison/super admin only) ----------
export interface RepaymentAccount {
  studentId: ID; status: RepaymentStatus; graceEndsAt?: ISODate;
  nextPayment?: { dueAt: ISODate; amountRM: number }; method?: 'manual' | 'salaryDeduction' | 'restructured';
  missedCount: number; payments: { at: ISODate; amountRM: number; status: 'paid' | 'missed' }[];
  restructureRequest?: { status: 'submitted' | 'approved'; at: ISODate };
}
export interface TierView { tier: Tier; status: RepaymentStatus; benefits: { id: BenefitId; state: 'unlocked' | 'paused' | 'preview' }[]; pausedCount: number; }
export type BenefitId = 'openJobs' | 'partnerRoles' | 'courses' | 'profileBoost' | 'coaching';
export type RoleAccess = 'full' | 'locked' | 'hidden';     // the ONLY tier-derived thing job UI sees

// ---------- notifications ----------
export interface AppNotification { id: ID; studentId: ID; type: 'invitation' | 'invitationExpiring' | 'interview' | 'newMatches' | 'rescored' | 'paymentDue' | 'benefits' | 'evidence' | 'threshold'; channel: ('push' | 'sms' | 'email' | 'inApp' | 'digest')[]; body: LocalizedText; at: ISODate; read: boolean; link?: string; }

// ---------- agency ----------
export type OfficerRole = 'superAdmin' | 'programmeOfficer' | 'partnershipManager' | 'aiGovernanceLead' | 'learningManager' | 'collectionLiaison' | 'leadershipViewer';
export interface Officer { id: ID; name: string; role: OfficerRole; initials: string; }
export type QueueId = 'evidence' | 'placements' | 'partnerRoleApprovals' | 'partnerApplications' | 'portalFeedIssues' | 'skillDisputes' | 'lowConfidence' | 'tierOverrides' | 'courseSubmissions';
export interface QueueDef { id: QueueId; ownerRole: OfficerRole; title: LocalizedText; slaWorkingDays: number; }
export interface QueueItem {
  id: ID; caseId: string; queueId: QueueId; subjectLabel: string;   // anonymised e.g. "Student S-20418"
  subjectRef: { type: 'student' | 'partner' | 'role' | 'portal' | 'course'; id: ID };
  reason: LocalizedText; aiRecommendation?: { action: 'approve' | 'reject' | 'escalate'; confidence: Confidence; rationale: string };
  createdAt: ISODate; ageWorkingDays: number; sla: 'onTime' | 'dueToday' | 'overdue';
  status: 'open' | 'approved' | 'rejected' | 'escalated'; assignee?: ID;
}
export interface Dispute { id: ID; studentId: ID; skillId: ID; reason: string; studentComment: string; openedAt: ISODate; status: 'open' | 'upheld' | 'corrected' | 'evidenceRequested'; taxonomyIssue?: boolean; }
export interface AccountFlag { id: ID; studentId: ID; kind: 'duplicateIC' | 'reusedEvidence' | 'scoreJump' | 'partnerReport'; detail: string; raisedAt: ISODate; }
export interface Placement { id: ID; studentId: ID; employer: string; role: string; salaryBand: string; startDate: ISODate; source: 'talentPartner' | 'portal' | 'other'; daysToHire: number; verification: 'autoVerified' | 'pending' | 'verified'; }
export interface TierRuleSet { version: number; status: 'draft' | 'pendingApproval' | 'scheduled' | 'active'; effectiveAt?: ISODate; rules: Record<string, string | number | boolean>; drafter: ID; approver?: ID; studentNotice: LocalizedText; }
export interface ImpactPreview { sampleSize: number; up: number; down: number; unchanged: number; byInstitution: { key: string; up: number; down: number; unchanged: number }[]; byProgramme: { key: string; up: number; down: number; unchanged: number }[]; tierMoves?: { aToB: number; bToA: number; rolesGained: number; rolesLost: number }; }
export interface SyncStatus { lastSyncAt: ISODate; recordsUpdated: number; errors: number; state: 'ok' | 'late' | 'failed'; }
export interface TierOverride { id: ID; studentId: ID; proofEvidenceId: ID; requestedAt: ISODate; status: 'pending' | 'active' | 'expired' | 'rejected'; expiresAt?: ISODate; reason?: string; }
export interface AuditEntry { id: ID; at: string; officerId: ID; action: string; recordType: string; recordId: ID; reason?: string; where: string; /* screen + IP placeholder */ }
export interface Alert { id: ID; kind: 'syncFailed' | 'feedStale' | 'escalationSpike' | 'aiConfidenceDrop'; message: LocalizedText; at: ISODate; link: string; severity: 'info' | 'attention'; }
export interface KpiPoint { month: string; value: number; }
export interface ReportDef { id: 'employment' | 'jobSearch' | 'repayment' | 'partnerHealth' | 'skillsLearning' | 'aiQuality' | 'operations'; audience: OfficerRole[]; cadence: 'weekly' | 'monthly'; }
export interface Note { id: ID; by: ID; at: ISODate; body: string; }
