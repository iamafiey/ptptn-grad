# CLAUDE.md — PTPTN Graduate Platform prototype

Clickable pitch prototype. No backend. Read `BUILD_PLAN.md` for routes, types, phases and progress.

## Sources of truth
- `docs/student-dashboard-flow.md`, `docs/admin-dashboard-flow.md`, `docs/visual-direction.md` — specs win over the plan.
- Spec "open decisions" are settings in `src/config/programmeSettings.ts`, never hardcoded.

## Conventions
- Components import data only via `src/services/*` (async, API-shaped), never from `src/data/*` directly.
- AI is simulated deterministically: same input → same output; results carry `modelVersion`, `confidence`, rationale.
- All UI strings go in `src/i18n/en.ts` (BM in `ms.ts`, falls back to EN). Student-facing data text uses `LocalizedText`.
- Styling uses token classes only (no raw hex, no default Tailwind blue/indigo, no pure #000/#FFF text).
- Glass only on chrome (top bar, tab bar, rail, sheet header). Sunrise at most once per screen. Serif max two elements per screen; never on buttons, chips, labels or numbers. One primary button per screen.
- Student secondary actions are bottom sheets, not routes.
- localStorage only for role, language, demo persona/officer role. Demo state is in-memory; "Reset demo" reseeds.

## Hard constraints
- Repayment data never reaches job/employer UI: those components get `RoleAccess` only. No "arrears", no amounts on Home or job screens.
- Agency repayment fields render only for collection liaison and super admin (`RepaymentGate`).
- Employer views go through `toEmployerView()` until a student accepts contact.
- Fictional data only; masked ICs; no scraping or real portal calls.

## Workflow
- After each phase: `npm run typecheck && npm run lint && npm run build`, screenshot check, update `BUILD_PLAN.md` §0, commit, push to `claude/sleepy-gauss-350hmi`.
