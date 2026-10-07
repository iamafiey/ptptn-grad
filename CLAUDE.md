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

## Stack notes
- Tailwind 4 with the JS config loaded via `@config` in `src/styles/globals.css`. `theme.colors` is *replaced*, so only token colours exist (no default blue/indigo).
- Type scale is utilities: `t-display-xl`, `t-display-l`, `t-title`, `t-heading`, `t-subheading`, `t-body`, `t-body-strong`, `t-caption`, `t-micro`, `t-label` (uppercase section label), `t-body-sm` (agency), plus `tabular`.
- `glass` (chrome only) and `frost-lock` (locked cards) are utilities. Put `-webkit-backdrop-filter` *before* `backdrop-filter`: the minifier keeps only the last duplicate.
- Content on Sunrise goes inside `.on-sunrise` (via `SunriseCard`), which pins ink colours dark in both themes.
- Motion comes from `motion/react`, with tokens in `src/lib/motion.ts`. Always honour `useReducedMotion()` (fade only).
- `/styleguide` is a dev reference. Its explanatory copy is exempt from i18n; product components inside it still use `t()`.

## Scripts
- `npm run icons`: re-render the PWA PNGs from `public/icons/icon.svg`.
- `node scripts/shoot.mjs <url> <out.png> [w] [h] [fullPage 1|0] [js]`: screenshot plus console-error report (needs `vite preview` running).
- `node scripts/check-overflow.mjs <url> [width]`: reports page-level horizontal scroll and the offending elements.

## Workflow
- After each phase: `npm run typecheck && npm run lint && npm run build`, screenshots at 390×844 and 1440×900, overflow check at 360, update `BUILD_PLAN.md` §0, commit, push to `claude/sleepy-gauss-350hmi`.
