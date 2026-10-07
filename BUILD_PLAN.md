# PTPTN Graduate Platform — Build Plan

A clickable, demo-ready prototype for a client pitch to PTPTN. It has no backend. All data is typed mock data behind a service layer, and every AI feature is simulated deterministically.

**Sources of truth:**
- [`docs/student-dashboard-flow.md`](docs/student-dashboard-flow.md)
- [`docs/admin-dashboard-flow.md`](docs/admin-dashboard-flow.md)
- [`docs/visual-direction.md`](docs/visual-direction.md)

If this plan and the specs disagree, the specs win.

**Status:** Phases 1a and 1b done. Next: Phase 2 (student onboarding, AI skill translation, skill profile).

---

## 0. Progress

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Specs read, build plan | ✅ Approved |
| 1a | Scaffold, PWA, tokens, `/styleguide` | ✅ Approved |
| 1b | Shells for both roles, role switcher, navigation, i18n | ✅ Done |
| 2 | Student onboarding, AI translation reveal, skill profile | ⬜ |
| 3 | Student Home and Opportunities (Partner roles, Open jobs, Job search log) | ⬜ |
| 4 | Student Learn, Repayment standing and tier states | ⬜ |
| 5 | Agency Home, queues, evidence verification, partner role approvals | ⬜ |
| 6 | Agency Partners, Students, AI governance, Tier rules (and Learn catalogue, see §9) | ⬜ |
| 7 | Agency Reports, audit log, polish, demo walkthrough script | ⬜ |

### Phase log

- **Client decisions after the 1a review** (these override `docs/visual-direction.md`):
  - Inter only, everywhere: no serif and no Geist. Display headlines are Inter 600 with tight tracking; the accent phrase renders in ink-2 instead of italic serif.
  - Corner radius max 8px: 4px chips, 6px controls, 8px cards, hero, sheets and tab bar. No pill buttons.

- **1a (scaffold + styleguide).**
  - Built: Vite/React/TS/Tailwind 4, tokens (light + dark), fonts, PWA manifest, icons and service worker, i18n plumbing (EN + partial BM), domain types, UI primitives and signature student components.
  - `/styleguide` shows: type, colour, Sunrise, glass shell in a phone frame (collapsing top bar, floating tab bar), buttons, chips, inputs, cards, locked role, sheet, motion and agency density.
  - Checks: typecheck, lint and build all pass. No console errors. No horizontal overflow at 360px.
- **1b (shells, role switching, i18n).**
  - Student shell: collapsing glass top bar (avatar → Settings sheet, Demo, bell), floating tab bar on mobile, frosted left rail and centred 430px column at ≥1024px, demo controls panel in the margin at ≥1280px, Sunrise wash on Home only.
  - Onboarding shell: back, 10-step progress, one primary action per step. All 10 steps are clickable placeholders.
  - Agency shell: frosted sidebar filtered by officer role (the spec's navigation table), sticky header with search, officer-role picker, Student | Agency toggle, BM/EN and bell. Mobile drawer carries the workspace toggle. Gated sections show "Not available for your role".
  - Demo state (`DemoProvider`): workspace, persona, officer role (saved as preferences), programme settings (in memory), Reset demo.
  - `src/config/programmeSettings.ts` holds every open decision with its example value.
  - Every route in §2 exists as a placeholder naming its phase. Each workspace loads in its own chunk.
  - i18n: shell, navigation, roles, page titles and onboarding titles in EN and BM.
  - Checks: typecheck, lint and build pass. 14 screenshots (390/360/1024/1440, both roles, EN/BM) with no console errors or overflow. `scripts/smoke.mjs` passes 8 navigation checks.

---

## 1. Stack and project structure

| Concern | Choice | Why |
| --- | --- | --- |
| Build | Vite 8, React 19, TypeScript (strict) | As requested (current majors at build time) |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`), loading `tailwind.config.ts` via `@config`. Every token is a CSS variable on `:root` and `.dark`, mapped in that config | Spec §Tailwind setup. Tailwind 3's toolchain had 7 open npm audit advisories; v4 has none |
| Routing | React Router 8 (`react-router`, `createBrowserRouter`) | As requested |
| Icons | `lucide-react` at 1.5 stroke, 20px | Spec §Iconography |
| Motion | `motion` (Framer Motion), for sheet springs (380/34), staggered reveal and number tick-ups | Spec §Motion; also honours `prefers-reduced-motion` |
| Charts (agency) | `recharts`, styled with the tokens | 6-month trends, monitors, fairness views |
| PWA | `vite-plugin-pwa`: manifest, icons, standalone display, theme colour `#F3F0EA`, offline shell | Spec §App shell |
| Fonts | Inter only, for everything including display headlines, bundled via `@fontsource-variable/inter`. No serif, no Geist, no external font requests | Client decision after Phase 1a review (overrides spec §Typography) |
| State | React context and `useReducer` per domain, seeded from mocks and in memory only. A **Reset demo** action reseeds everything | No localStorage-critical flows |
| localStorage | Only `role`, `lang` and the chosen demo persona/officer role (these count as preferences) | Constraint |
| Exports | Skill CV and report "PDF" use a print stylesheet plus `window.print()`. "Excel" uses a CSV download | No heavy libraries |

```
src/
  main.tsx, App.tsx, router.tsx
  styles/          tokens.css (CSS vars, light + dark), globals.css, print.css
  i18n/            en.ts, ms.ts, index.ts (useT hook, typed keys, en fallback)
  config/          programmeSettings.ts  ← every "open decision" as typed config
  types/           domain.ts (all types below), agency.ts
  data/            students.ts, partners.ts, partnerRoles.ts, portals.ts, openJobs.ts,
                   taxonomy.ts, courses.ts, jobLog.ts, evidenceSamples.ts,
                   queues.ts, officers.ts, reports.ts, audit.ts, notifications.ts
  services/        skillTranslation.ts, evidenceCheck.ts, tiers.ts, matching.ts,
                   partners.ts, queues.ts, reports.ts, audit.ts, rubric.ts, delay.ts
  state/           DemoProvider (persona, role, officer role), StudentStore, AgencyStore
  components/
    ui/            primitives shared by both roles
    student/       app shell and signature student pieces
    agency/        sidebar shell, tables and side panels
  features/
    student/       onboarding/, home/, profile/, opportunities/, learn/, repayment/, settings/
    agency/        home/, queues/, job-search/, partners/, students/, learn/, ai/, tiers/,
                   reports/, settings/
  routes/styleguide/
public/
  icons/           PWA icons (192, 512, maskable, apple-touch)
  evidence/        SVG placeholder "screenshots": emails, portal confirmations, offer letters, certificates
```

**Service layer contract:** every service function is `async`, returns plain typed data shaped like a real API response (ids, timestamps, `modelVersion`, `confidence`), and goes through `delay()` so loading states are real. Components never import from `src/data/` directly, only from `src/services/`. That way a mock can later be swapped for a real `fetch` without touching UI code.

---

## 2. Routes and screens

### 2.1 Global

| Route | Screen |
| --- | --- |
| `/` | Redirects to `/s/home` or `/a/home` based on the saved role |
| `/styleguide` | Type, colour (light/dark), glass, buttons, chips, inputs, cards, locked state, sheet, segmented control, motion demos, Inter-only switch |

**Role toggle and demo controls (`DemoSwitcher`).** The brief puts the role toggle in the header:
- **Agency header:** a segmented **Student | Agency** control, plus an *officer role* picker (7 roles). The picker scopes the sidebar and queues.
- **Student top bar:** the spec reserves left for the avatar and right for the bell, so the toggle is a small **"Demo"** pill next to the bell. Tapping it opens a sheet with Student/Agency, *persona* (3 demo students), language and **Reset demo**.
- **Desktop (≥1024px):** the same controls also sit in the canvas margin outside the 430px column, so presenters never have to dig into a sheet.

### 2.2 Student workspace (`/s/*`): mobile PWA, 430px centred column on desktop

| Route | Screen | Spec ref |
| --- | --- | --- |
| `/s/onboarding/signin` | MyDigital ID, or IC + PTPTN account no. + OTP (simulated) | Onboarding 1 |
| `/s/onboarding/consent` | PDPA consent card, single "I agree", full terms sheet | 2 |
| `/s/onboarding/confirm` | Auto-filled loan record (institution, programme, grad year, CGPA band), "Looks right" or edit sheet | 3 |
| `/s/onboarding/academic` | Transcript upload (PDF or photo) or "Pull from university" (shown only if the config says integrated), then extraction preview | 4 |
| `/s/onboarding/activities` | Guided activity cards, one at a time, with example prompts and evidence attach. Also covers part-time work, internships, competitions and freelance. "Skip for now" shows the profile strength cost | 5 |
| `/s/onboarding/preferences` | Role interest chips, states, relocate toggle, salary floor (RM), earliest start | 6 |
| `/s/onboarding/translating` | 10–20s staged AI progress ("Reading your transcript… Mapping 6 activities to skills…") | 7 |
| `/s/onboarding/reveal` | Sunrise shimmer, staggered skill cards, "We found *14 skills*" | 8 |
| `/s/onboarding/review` | Per skill: Keep, Edit level down, Hide, "This isn't right". Add missing skill (capped at Foundation) | 9 |
| `/s/onboarding/visible` | "Let Talent Partners find me" toggle (default on), with an employer-view preview | 10 |
| `/s/home` | Urgency-ordered feed with modules 1–9, in all Home states (new, live-no-interest, invited, behind, hired) | Dashboard home |
| `/s/profile` | Strength ring, editable AI summary, skills grid by category (sort by level), activities timeline linked to skills, **See as employer** toggle, **Download my skill CV** | Skill profile |
| `/s/profile/cv` | Print-ready skill CV (anonymised or named), plus a "shareable link" copy | Skill profile |
| `/s/opportunities` | Segmented control: **Partner roles** · **Open jobs** · **My job search log** (`?tab=`) | Opportunities |
| `/s/learn` | In progress, Recommended for your gaps, Completed (certificates), Browse all | Learn |
| `/s/learn/gap/:skillId` | Gap view: current → target level, "Unlocks 12 more matches", 2–4 course options | Learn 1–2 |
| `/s/repayment` | Status badge, next payment or grace end, benefits list, last 6 payments, Pay now hand-off, ways back (Tier B), job-seeking threshold link | Repayment |
| `/s/notifications` | Notification list (all event types in the spec table) | Notifications |

**Bottom sheets** (not pages, per spec), each a component opened through a `useSheet()` stack:
- Settings: language, visibility, notifications, data and privacy, PDPA delete request
- Skill detail: evidence chips, confidence, rationale, rubric hits, actions
- Dispute skill
- Add evidence, then the re-score result ("Team leadership: Working → Advanced")
- Partner role detail and why-you-match
- Accept and share profile
- Ask a question (identity hidden)
- Decline with reason chips
- Pipeline detail (Invited → Talking → Interview → Offer → Hired)
- Open job detail and apply-on-portal confirm (logs a pending entry)
- Log an application: portal + role → evidence → AI check progress → result
- Log entry detail: outcome update, re-upload
- Course detail and enrol, then complete → certificate attached → re-score celebration
- Ways back: pay missed amount, salary deduction, restructure request
- Pay-now hand-off notice
- Hired: confirm employment
- Notifications quick view

### 2.3 Agency workspace (`/a/*`): desktop-first, frosted sidebar

The sidebar sections and their visibility follow the admin spec's navigation table, driven by the officer role selected in the header.

| Route | Screen | Spec ref |
| --- | --- | --- |
| `/a/home` | Header (role badge, global search, bell, BM/EN), My queues cards (count, oldest age, SLA chip), Programme pulse (5 KPIs vs last month, the one Sunrise surface), Alerts, Recent activity (last 10, with undo) | Admin home |
| `/a/queues/:queueId` | Generic queue screen for all 9 queues. Table of items (case ID, anonymised subject, reason, AI recommendation + confidence, age, SLA), with a **side panel** case view: Approve / Reject with reason / Escalate | Queue item anatomy |
| `/a/job-search/evidence` | Evidence queue. Side panel shows the evidence image beside AI-extracted fields, check results and reasons, with Verify / Reject with reason / Flag account | Evidence verification |
| `/a/job-search/monitor` | Evidence monitor: daily volume, auto-verified share, escalation rate, decision time, by portal, spike alert | Evidence monitor |
| `/a/job-search/placements` | Placements list (partner vs open market), placement confirmations queue | Placements |
| `/a/partners` | Talent Partner directory with commitment tracker flags; Pause / End / Renew / Add note | Partners |
| `/a/partners/:partnerId` | Partner record: onboarding stage (Outreach → Verification chips → Workspace → Probation 60d), commitments, roles, invitations, reports, notes | Onboarding |
| `/a/partners/approvals` | Partner role approvals: criteria checklist (salary floor, contract type, partner standing), approve or return with reason, tier access rule preview | Partner role approvals |
| `/a/partners/portals` | Portal feeds (Active feed / Link-out only / In discussion), last sync, imported count, feed rules, curated portal list editor, reported listings | Portal feeds |
| `/a/partners/matching` | Partner matching monitor, plus "unseen students" (no views in 60 days) | Matching monitor |
| `/a/students` | Directory with masked name/IC, filters (institution, programme, state, cohort, stage, no activity 60d) | Student oversight |
| `/a/students/:studentId` | Record: student view / employer view tabs, skills with explainability, timeline, tier badge only, actions (note, message, pause visibility, trigger re-score). "Reveal name/IC" is logged to audit | Record |
| `/a/students/disputes` | Skill disputes: evidence, AI rationale and student comment side by side; Uphold / Correct / Request evidence; flag a taxonomy issue | Skill disputes |
| `/a/students/flags` | Flagged accounts: duplicate IC, reused evidence, score jumps, partner reports | Flagged accounts |
| `/a/learn` | Course catalogue, add-course flow (AI-suggested skill mappings, level cap, tier access), providers, gap insights | Learn catalogue |
| `/a/ai/taxonomy` | Category → skill tree, definitions, example activities, related roles, rubric per level, draft vs published version | Taxonomy manager |
| `/a/ai/rubric` | Rubric change flow: draft → impact preview (up/down/unchanged by institution and programme) → second approver → publish | Rubric change |
| `/a/ai/evidence-rules` | Evidence checks and the auto-verify confidence threshold (configurable) | Open decision |
| `/a/ai/quality` | Weekly sample review, AI–reviewer agreement and threshold alert, low-confidence holds, fairness view | AI quality |
| `/a/tiers` | Rule table (versioned) → change flow with impact preview → second approver → scheduled effect plus student notice preview | Tier rules |
| `/a/tiers/sync` | Sync monitor (last sync, records, errors), "no downgrade on missing data" banner | Sync monitor |
| `/a/tiers/overrides` | Override requests with proof → restore Tier A for N days → auto-expiry | Overrides |
| `/a/tiers/distribution` | Tier share by cohort, monthly B → A recoveries | Distribution |
| `/a/reports` | Report index (7 reports from the spec, scoped by role) | Reports |
| `/a/reports/:reportId` | Headline numbers with change, one main chart, breakdown table, filters (cohort, institution, state, date), Export PDF/CSV | Reports pattern |
| `/a/reports/cohort` | Cohort view: visible → hired → repaying, month by month | Cohort view |
| `/a/settings` | Tabs: Roles and access, **Programme settings (open decisions)**, Audit log, PDPA (consents, data requests, deletion flow, retention), Integrations, Safety (outreach kill switch, scam notice, keyword monitor) | Audit, safety, PDPA |

**Shared agency patterns:**
- Side panel case view (never leaves the queue)
- Explainability panel (evidence → extracted facts → mapping → rubric rule → model and rubric versions → timestamp)
- Two-person approval
- Impact preview
- Reason-required dialog
- Masked field with logged reveal
- Every mutating action writes an audit entry (who, what, record, when, where, reason)

### 2.4 Hard constraints, enforced in code

- **Repayment data containment.** Tier status lives behind `services/tiers.ts`. Opportunity and employer-view components receive only `access: 'full' | 'locked'`, never tier, status or amounts. Locked cards render only the lock and "Unlock with good standing". No amount owed appears on Home or job screens; the Home behind-card says "3 benefits are paused". The word "arrears" is never used.
- **Agency repayment visibility.** On the agency side, repayment fields render only for the *Collection liaison* and *Super admin* roles. Everyone else sees a tier badge on the student record, and nothing on Partners or Learn.
- **Anonymised employer view.** The employer view uses a dedicated `toEmployerView(profile)` mapper that strips name, IC, photo and institution-identifying free text. Partner-facing previews always use it until the invitation status is `accepted`.
- **Fictional data only.** All names, ICs and companies are fictional. ICs are shown masked (`9xxxxx-xx-1234`) and use an obviously fake pattern. No scraping and no real portal calls.

---

## 3. Configurable open decisions (`src/config/programmeSettings.ts`)

Every open decision is a typed setting seeded with the spec's example value. Settings are editable in **Agency → Settings → Programme settings** (and tier-related ones in **Repayment tiers**). Changes apply live, in memory, so a presenter can flip a decision mid-pitch and show its effect.

| Setting | Type | Example / default | Affects |
| --- | --- | --- | --- |
| `tierB.partnerRoles` | `'hidden' \| 'earlyAccessWindow'` | `'earlyAccessWindow'` | Locked vs hidden partner roles for Tier B |
| `tierB.earlyAccessDays` | number | 14 | Visible after N days |
| `tierB.courses` | `'freePlusPreviews' \| 'freeOnly'` | `'freePlusPreviews'` | Learn access |
| `tier.graceCountsAsTierA` | boolean | true | Persona 2 |
| `tier.missedPaymentsForTierB` | number | 1 | Tier calc |
| `tier.restructuredCountsAsTierA` | boolean | true | Tier calc |
| `tier.restoreOn` | `'syncConfirmed'` | `'syncConfirmed'` | Ways back |
| `tier.overrideDays` | number | 14 | Overrides |
| `jobSeeking.monthlyThreshold` | number | 4 verified applications per month | Job search progress, Repayment |
| `jobSeeking.supportsDeferment` | boolean | true | Repayment copy |
| `evidence.autoVerifyConfidence` | 0–1 | 0.85 | Evidence check outcome |
| `evidence.acceptedTypes` | list | confirmation email, screenshot, interview invite, offer letter | Log sheet |
| `evidence.applicationPeriodDays` | number | 90 | "date out of period" check |
| `partners.salaryFloorRM` | number | 3000 | Role approvals |
| `partners.allowedContractTypes` | list | permanent, graduate programme | Role approvals |
| `partners.probationDays` | number | 60 | Partner onboarding |
| `placements.triggerRepaymentSetup` | boolean | false | Hired state, placement record |
| `records.universitySource` | `'uploadOnly' \| 'integration'` | `'uploadOnly'` (with UKM shown as integrated when set to `integration`) | Onboarding step 4 |
| `taxonomy.source` | `'own' \| 'alignedNational'` | `'own'` (label on taxonomy page) | AI governance |
| `portals.mode` per portal | `'feed' \| 'linkOut'` | 2 feeds, 1 link-out | Open jobs tab |
| `sla.<queueId>` | working days | the spec table values | Queue SLA chips |
| `roles.merged` | role groupings | none merged | Sidebar scoping |
| `retention.months` | per data class | 24 / 60 / 84 placeholders | PDPA |
| `ai.lowConfidenceThreshold` | 0–1 | 0.6 | Low-confidence holds |
| `ai.agreementAlertThreshold` | % | 90 | AI quality alert |
| `student.visibilityStartsFinalSemester` | boolean | true | Final-year edge case |

---

## 4. Data model (TypeScript)

These are the draft types for `src/types/domain.ts`. Names may tighten during the build, but the shape won't change.

```ts
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
```

---

## 5. Component inventory

### 5.1 `components/ui` (shared primitives, all token-driven)

- `Button`: primary (ink pill, 48px), secondary (white + hairline), tertiary (text + arrow), icon button; `size`, `loading`
- `Chip`: `done | pending | attention | info | muted | ink` (black pill badge)
- `Card`: solid, hairline + shadow-1, radius 20; `HeroCard` (Sunrise, radius 28)
- `Glass`: chrome-only wrapper with the `@supports` fallback
- `Sheet` and `useSheet()` stack: spring 380/34, glass header handle, drag to dismiss, focus trap, safe-area bottom padding
- `Dialog`: agency confirmation dialog and reason-required dialog
- `SidePanel`: agency right-hand case panel
- `SegmentedControl`: muted track, white selected segment + shadow-1
- `Input`, `Textarea`, `Select`, `FloatingLabel`: 52px, muted surface, radius 14, ink focus ring
- `Toggle`, `Checkbox`, `RadioCard`, `ChipSelect` (multi-select chips), `Slider` (salary floor)
- `IconTile` (36px soft square), `LogoTile` (40px, monogram fallback), `Avatar` with `StrengthRing`
- `ProgressRing`, `MatchRing` (small %), `LevelBar` (3 segments), `ProgressBar`
- `AnimatedNumber`: 400ms tick-up that respects reduced motion
- `EmptyState`: line illustration in ink-3, one sentence, one button
- `Skeleton`, `Shimmer` (Sunrise shimmer for AI progress)
- `SectionLabel` (micro uppercase), `Divider`, `Stat` (number + delta), `Toast`
- `DataTable` (agency): sortable, sticky header, row click → side panel, density compact
- `FilterBar`, `SearchField`, `Tabs`
- `Chart` wrappers: `TrendLine`, `BarBreakdown`, `StackedShare`, `Funnel` (cohort)

### 5.2 `components/student`

- `StudentShell`: 430px column on desktop, safe areas, scroll container
- `TopAppBar`: large serif title that cross-fades to a compact glass bar; avatar with strength ring opens Settings; bell; Demo pill
- `TabBar`: floating glass pill, 5 tabs, ink active pill
- `DesktopRail`: frosted left rail, ≥1024px
- `HeroCard`: state-driven serif headline, Live chip, one ink button
- `NextStepCard`: "YOUR NEXT STEP"
- `PartnerInterestCard`: views and invitations, change vs last week
- `PartnerRoleCard` and `LockedRoleOverlay`: content shape visible under 40% glass, "Unlock with good standing"
- `OpenJobCard`, `PortalShortcutCard`: the curated link-out fallback
- `JobLogRow`, `EvidenceThumb` (56px + status chip), `MonthlySummaryCard` (threshold progress)
- `SkillCard`, `SkillDetailSheet`, `EvidenceChip`, `ConfidenceLabel`, `RescoreBanner` ("Working → Advanced")
- `SkillSnapshot`, `GapCallout`, `CourseCard`, `CourseProgressCard`, `CertificateCard`
- `StandingBadge`, `BenefitsList`, `WaysBackCard`, `PaymentHistoryList`, `CelebrationState` (Tier A restore, the one Sunrise use)
- `SetupChecklist`, `EmployerPreview` (anonymised card), `ActivityTimeline`
- Onboarding: `StepScaffold` (progress + one primary), `ConsentCard`, `RecordConfirmCard`, `TranscriptUploader`, `ActivityComposer` (guided one-at-a-time with prompt examples), `PreferencesForm`, `TranslationProgress`, `SkillReveal`, `SkillReviewList`, `GoVisibleCard`
- `InvitationPipeline` (Invited → Hired stepper), `DeclineReasonChips`, `AskQuestionComposer`
- `EvidenceUploader`: file input or "Use a sample" picker, plus check progress and result
- `DemoSwitcher`

### 5.3 `components/agency`

- `AgencyShell`: frosted sidebar, header with role badge, global search, bell, BM/EN, role toggle and officer-role picker
- `Sidebar`: sections filtered by `OfficerRole`
- `QueueCard`, `QueueTable`, `CaseSidePanel` (Approve / Reject with reason / Escalate)
- `PulseHeader` (Sunrise), `KpiTile`, `AlertList`, `RecentActivity` (with undo)
- `EvidenceReview`: image viewer beside extracted fields and a check list
- `ExplainabilityPanel`, `RubricBreakdown`, `ModelVersionTag`
- `CriteriaChecklist` (role approvals and partner verification pass/warn/fail)
- `ImpactPreviewPanel`, `TwoPersonApproval`, `VersionHistory`
- `MaskedField` (reveal → audit), `TierBadge`, `RepaymentGate` (renders children only for liaison/super admin)
- `PartnerOnboardingStepper`, `CommitmentTracker`, `PortalFeedRow`
- `StudentTimeline`, `EmployerViewToggle`
- `ReportLayout` (headline → chart → table → filters → export), `CohortFunnel`
- `AuditLogTable`, `SettingsForm` (driven by the `programmeSettings` schema)

---

## 6. Simulated AI services

All results are deterministic. The same inputs always give the same output, which mirrors the spec's "same activity always yields the same skills".

- **`skillTranslation.ts`**
  - `translate(studentId, inputs, onProgress)` emits staged `TranslationProgressEvent`s over about 12s (shortened to 3s with `?fast=1` for rehearsals), then returns a `SkillTranslationResult`.
  - The demo personas have pre-computed results. Persona 2 yields exactly the spec's worked example (Logistics coordination: Advanced; Team leadership: Working; Stakeholder communication: Working) inside "14 skills from 9 activities".
  - Activities typed live map through a keyword → skill rule table (`ruleId`s), and levels come from the rubric (duration, responsibility, scale, verified evidence). Typed activities therefore get sensible, repeatable skills too.
  - `rescore(skillId, newEvidence)` returns a `RescoreResult`.
- **`evidenceCheck.ts`**
  - `check(entry, file, onProgress)` runs these stages: reading → extracting → company lookup → date → image integrity. It returns an `EvidenceCheckResult`.
  - The sample evidence files are labelled for demo control: clean email (auto-verified, 0.94), blurry screenshot (rejected: unreadable), unknown company (escalated, 0.62), edited image (escalated: possible tampering), and old date (escalated: out of period).
  - Real uploads run through a deterministic hash of the file name and size, so outcomes are repeatable. The decision compares confidence against `evidence.autoVerifyConfidence`.
- **`tiers.ts`**
  - `getTierView(studentId)` derives the tier from `RepaymentAccount` plus settings.
  - `getRoleAccess(studentId, role)` returns `'full' | 'locked' | 'hidden'`, honouring the early-access window.
  - `requestWayBack(kind)` returns a pending status. A demo "Simulate sync confirmed" action then restores Tier A and plays the celebration.
- **`matching.ts`**: match % and why-you-match from required skills vs the student's kept skills. Gaps report "unlocks N matches" by counting roles that would clear the threshold.
- **`rubric.ts`**: impact preview for a rubric or tier rule change over a sample of 500 synthetic profiles, computed deterministically.
- **`queues.ts` / `audit.ts`**: queue CRUD with SLA calculation in working days (Malaysian weekends Sat–Sun, placeholder). Every action appends an `AuditEntry`.

---

## 7. Mock data plan

**Today in the demo world is 7 Oct 2026.** All ages and dates are relative to that.

**Demo students** (fictional; IC numbers are masked and fake):

| # | Persona | State |
| --- | --- | --- |
| 1 | **Nurul Aina binti Rahman**, BBA (Hons) Marketing, UiTM Shah Alam, graduating 2026, Selangor | **Mid-onboarding**: stopped at step 5 (2 of 4 activities added). Home shows the setup checklist and "Employers can't find you yet". Final-semester visibility rule demonstrable |
| 2 | **Muhammad Hafiz bin Azman**, BSc (Hons) Logistics & Supply Chain, UKM, graduated Mar 2026, Negeri Sembilan | **Visible, grace period (Tier A)**. 14 skills from 9 activities (incl. Exco Logistik, Kelab Sukarelawan UKM). **2 partner invitations**: one *Invited* (reply by Friday 9 Oct), one *Talking*. Job search log has 7 entries across verified / under review / rejected / pending evidence; 3 of 4 verified this month. One course in progress; one disputed skill |
| 3 | **Kavitha a/p Ramasamy**, BEng (Hons) Electrical, UTHM, graduated 2024, Johor | **Tier B "behind"**: 1 missed payment, 3 benefits paused. Partner roles locked under the early-access rule. Open jobs and log fully available. Ways back offered; one restructure request can be submitted and then "confirmed by sync" for the celebration |

**Other data:**
- **Talent Partners (10 fictional):**
  - Logistics: Seri Mutiara Logistik Berhad
  - Tech: Awan Teknologi Sdn Bhd
  - Energy: Cahaya Tenaga Berhad
  - Healthcare: Permata Health Group
  - Plantation: Rimba Agro Berhad
  - Construction: Lestari Bina Berhad
  - Finance: Selat Capital Berhad
  - Retail: Dian Retail Group
  - Aerospace MRO: Kestrel Aero Services
  - Telco: Merdu Telekom Berhad

  Statuses: 7 active, 1 onboarding, 1 paused, 1 in probation. Two are flagged by the commitment tracker. Names will be checked against real Malaysian companies before seeding, and any collision renamed.
- **Partner roles (15):** RM 3,000–5,500, mostly permanent or graduate programme, across Selangor, KL, Penang, Johor and Sarawak. 3 are pending approval: one below the salary floor, one on a contract type, and one with a partner on probation.
- **Portals (3 fictional):** *KerjaKini* (active feed), *LaluanKerjaya* (active feed, stale for 3 days, so it triggers an alert) and *MulaKerja* (link-out only, so it uses the curated list and search shortcuts). There are **30 open jobs** split 14/12/4 (the 4 are curated link-outs).
- **Taxonomy:** 40 skills in 6 categories (Leadership & teamwork, Communication, Operations & logistics, Digital & data, Business & finance, Problem solving & research). Each has a definition, example activities, related roles, 3-level rubric and evidence weights. Taxonomy is v3.2 (published) with a v3.3 draft carrying the spec's example change, "Exco roles under 6 months cap at Working".
- **Courses:** about 14 from 5 providers (mix of free, subsidised and paid; hosted and external), each mapped to at least 1 skill. 2 are pending in the course submissions queue.
- **Job search log:** entries in every status, with SVG placeholder evidence (Gmail-style confirmation, portal "Application received" screenshot, interview invite, offer letter, certificate). None imitate a real brand.
- **Agency queues (realistic counts and ages):**

  | Queue | Items | Oldest |
  | --- | --- | --- |
  | Job search evidence | 47 | 4d, 6 overdue |
  | Placement confirmations | 12 | — |
  | Partner role approvals | 3 | 1 due today |
  | Partner applications and reports | 4 | 1 report same-day |
  | Portal feed issues | 2 | — |
  | Skill disputes | 9 | — |
  | Low-confidence profiles | 21 | — |
  | Tier overrides | 5 | — |
  | Course submissions | 2 | — |

  About 120 items are fully detailed. Headline counts can exceed the detailed rows, with "showing 25 of 47" pagination.
- **Students directory:** ~60 synthetic rows across 12 public and private institutions and all states, generated by a seeded generator (no randomness at runtime).
- **Reports:** 6 months of trends (May–Oct 2026) for every KPI and report, plus a cohort funnel for the 2025 and 2026 cohorts. Pulse numbers are illustrative, e.g. 18,420 students visible, 10 active partners, 6,312 verified entries, 284 placements this month, Tier A share 81%.
- **Officers:** one per role (e.g. Puan Rosnah Ismail as programme officer; Encik Faizal Hamdan as collection liaison). Each comes with an audit log of about 80 seeded entries.

---

## 8. i18n

- `src/i18n/en.ts` is the typed source dictionary, with keys namespaced (`student.home.nextStep.label`). `ms.ts` is `Partial<typeof en>` and falls back to English per key.
- A `useT()` hook provides `t(key, vars)` with simple `{count}` interpolation and plural keys (`_one` / `_other`).
- Student-facing *data* (skill names, rationales, course titles, notices) uses `LocalizedText`.
- The language toggle sits in the student Settings sheet and the agency header. It persists to localStorage.
- **Build order:** English throughout. BM is filled for the shell, navigation, onboarding and Home during phases 1–3, then completed in Phase 7. A dev-only overlay highlights keys that are missing in BM. Headings are layout-tested in BM (spec: 20–30% longer).

---

## 9. Phased plan

**Every phase ends with these steps:**
1. `npm run typecheck && npm run lint && npm run build` pass.
2. The dev server runs, and I take Playwright screenshots at 390×844 (student), 1440×900 (agency) and 1280 (student desktop column).
3. I fix anything broken.
4. I update §0 here, commit and push to `claude/sleepy-gauss-350hmi`.
5. I send you a short "what to click" summary.

### Phase 1a: Scaffold and styleguide (stop for approval)
- Vite + React + TS + Tailwind + Router, ESLint and Prettier, path alias `@/`
- Tokens (light + dark) in `tokens.css`, mapped in `tailwind.config.ts`; fonts with Inter fallback
- PWA: manifest, icons (generated from an SVG monogram mark), standalone display, theme colour, safe-area CSS (`viewport-fit=cover`, `env(safe-area-inset-*)`)
- UI primitives needed for the styleguide
- **`/styleguide`**: type scale (with BM sample strings), colours and signals, glass over content, buttons, chips, inputs, segmented control, cards (hero, next-step, partner role, **locked role**, skill, log row), sheet demo, motion demos, light/dark switch, Inter-only switch
- **I stop here and wait for your approval.**

### Phase 1b: Shells, role switching and i18n
- `StudentShell`: collapsing top bar, floating tab bar, desktop rail at ≥1024, sheet host
- `AgencyShell`: frosted sidebar scoped by officer role, header
- `DemoProvider`, role toggle, persona picker, officer-role picker, Reset demo
- i18n plumbing, BM/EN toggle, placeholder pages for every route, service layer skeleton, and `programmeSettings` with the settings store

### Phase 2: Onboarding and skill profile
- All 11 onboarding steps, with persona 1 resuming mid-flow at step 5
- Translation progress and reveal animation
- Review actions (keep, lower, hide, dispute, add missing at Foundation)
- Go visible with employer preview
- Profile screen: summary, grouped and sortable skills, timeline links, See as employer, skill CV print view, and the skill detail sheet with add evidence → re-score

### Phase 3: Home and Opportunities
- Home modules 1–9 with all states (new / live-no-interest / invited / behind / hired)
- Partner roles tab: cards, why-you-match, accept / ask / decline, pipeline, locked and hidden states driven by settings
- Open jobs: feed cards and link-out that creates a pending log entry; curated portal list for the link-out-only portal
- Job search log: log sheet, evidence upload or sample, AI check, status detail, outcome updates, re-upload, monthly summary against the threshold
- Notifications

### Phase 4: Learn and Repayment
- Learn sections, gap view, course options, enrol (hosted or external)
- Progress, then complete → certificate → re-score ("9 new roles now match you")
- Tier B course previews
- Repayment screen for all 3 statuses: benefits, payments, Pay now hand-off, ways back sheet
- Simulated sync restore with the celebration
- Job-seeking threshold link to deferment

### Phase 5: Agency Home, queues, evidence, approvals
- Command centre (queues, pulse, alerts, recent activity with undo)
- Generic queue screen with side panel
- Evidence queue with the evidence review panel
- Evidence monitor
- Placements
- Partner role approvals with criteria checklist
- Audit writes wired from here on
- **Cross-role link:** an evidence entry escalated on the student side appears in the agency evidence queue, and the officer's decision flows back to the student's log.

### Phase 6: Partners, Students, AI governance, Tier rules
- Partner directory, record and onboarding stepper, commitment tracker, portal feeds, matching monitor
- Student directory (masked, with logged reveal), record with explainability, disputes, flags
- Taxonomy manager, rubric change flow with impact preview and two-person approval, evidence rules, quality and fairness
- Tier rules change flow, sync monitor, overrides with auto-expiry, distribution
- **Agency Learn catalogue** (catalogue, add course with AI-suggested mappings, providers, gap insights). The spec includes it but your phase list doesn't name it, so I've put it here and kept it lighter than the rest.

### Phase 7: Reports, audit, polish and demo script
- 7 reports with the shared layout, filters and PDF/CSV export; cohort view
- Settings: audit log, PDPA, retention, integrations, safety
- Complete BM pass
- Accessibility pass (focus, contrast, reduced motion, 44px targets)
- Empty and loading states, dark mode check
- **`DEMO_SCRIPT.md`**: a timed walkthrough (about 12 minutes) across the 3 personas and agency roles, with the exact clicks

---

## 10. Assumptions and points to confirm

These are the defaults I'll build with unless you say otherwise:

1. **Role toggle on the student side.** It's a small "Demo" pill by the bell that opens a sheet, plus margin controls on desktop, because the spec reserves the bar's left and right slots. The agency header gets a visible segmented toggle.
2. **Agency Learn catalogue** is included in Phase 6 (it's in the spec but not in your phase list).
3. **BM** is filled progressively for chrome and the key student flows, with full coverage in Phase 7.
4. **Dark mode** tokens are implemented and shown in the styleguide. The demo defaults to light and follows the system setting only if you want that.
5. **Hosting** isn't in scope. Static output works on any SPA host with a fallback to `index.html`. I can add a Netlify or Vercel config later if you want a live URL for the pitch.
