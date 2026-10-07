# Visual Direction — Student App

## Concept: "Warm, calm, quietly premium"

The student side is an installable mobile web app (PWA), not a website. It should feel like a well-made consumer finance or wellness app: warm neutral surfaces, frosted-glass navigation, editorial serif moments for emotion, a crisp sans for everything functional, and one warm gradient used like a spotlight.

It must not look like a government portal (no crest-blue headers, dense forms, or table-first screens), and it must not look like a generic AI-generated UI (no purple-blue gradients, glass on every card, emoji icons, or neon glows).

Reference mood: warm stone canvas, frosted sidebar and nav, serif display headline on a soft amber hero card, black pill badges, small lime accent for "done" states.

## App shell (PWA)

- `display: standalone`, with app icon, splash screen and theme colour set from the tokens below.
- **Baseline viewport:** 390 × 844. Supports 360 to 430 wide, with safe-area insets top and bottom.
- **Top app bar:**
  - A large title (serif) collapses into a compact glass bar on scroll.
  - The left side shows the avatar, which opens the Settings sheet; the right side shows the notifications bell.
- **Bottom tab bar:**
  - Floating glass pill, inset 12px from the screen edges and 12px above the safe area.
  - Five tabs: Home, Profile, Opportunities, Learn, Repayment.
  - The active tab shows an ink pill behind the icon and label; inactive tabs are icon plus a small label in secondary ink.
- **Secondary actions** (accept invitation, log application, dispute a skill) open as bottom sheets, not new pages.
- **Desktop (≥1024px):** the app shows as a centred 430px column on the warm canvas, with a frosted left rail replacing the tab bar. Don't stretch mobile layouts to full width.

## Colour

Warm neutrals do most of the work. The accent gradient appears at most once per screen.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--canvas` | #F3F0EA | #0E0D0B | App background |
| `--surface` | #FFFFFF | #1A1815 | Cards |
| `--surface-muted` | #F8F6F2 | #221F1B | Nested blocks, inputs, table headers |
| `--ink` | #17140F | #F4F1EA | Primary text, primary buttons, active tab |
| `--ink-2` | #6B645A | #A8A196 | Secondary text, labels |
| `--ink-3` | #A39C91 | #6E685F | Placeholder, disabled, metadata codes |
| `--hairline` | rgba(23,20,15,0.08) | rgba(255,255,255,0.08) | Borders, dividers |
| `--glass` | rgba(255,255,255,0.62) | rgba(26,24,21,0.58) | Nav bars, sheets' handle area |
| `--glass-edge` | rgba(255,255,255,0.75) | rgba(255,255,255,0.10) | 1px inner highlight on glass |

**Accent gradient, "Sunrise"** (warm amber; it signals opportunity, not money). Use it only for the Home hero card, the skills-reveal moment and the Tier A celebration:

```css
--sunrise: radial-gradient(120% 90% at 85% 10%, #FFE9A8 0%, rgba(255,233,168,0) 55%),
           linear-gradient(140deg, #FFF8E6 0%, #FFE08A 55%, #F6C453 100%);
```

**Signal colours.** These are always shown as chips with dark text, never as large fills.

| Token | Value | Meaning |
| --- | --- | --- |
| `--signal-done` | #C5F25A (text #1E2A05) | Verified, skill confirmed, course completed |
| `--signal-pending` | #FBE3A2 (text #5A4206) | Under review, invitation waiting |
| `--signal-attention` | #F7C9BC (text #6A2414) | Needs re-upload, benefits paused |
| `--signal-info` | #DCE6F2 (text #1D3550) | Neutral info, grace period |

Repayment states never use red. Tier B is shown with the attention chip plus a "ways back" action, consistent with the "reward, not punishment" principle.

## Typography

| Role | Font stack | Use |
| --- | --- | --- |
| Display | `"Instrument Serif", "Iowan Old Style", Georgia, serif` | Large titles, hero headlines, greeting, milestone moments |
| UI | `"Geist", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif` | Everything else |
| Numbers | UI stack with `font-variant-numeric: tabular-nums` | Scores, RM amounts, counts, dates |

Inter is the fallback, so the layout must still look right if Geist fails to load. Test with Inter only.

| Style | Font | Size / line | Weight | Tracking |
| --- | --- | --- | --- | --- |
| Display XL | Serif | 44 / 46 | 400 | -0.01em |
| Display L | Serif | 34 / 38 | 400 | -0.01em |
| Title (large app bar) | Serif | 30 / 34 | 400 | 0 |
| Heading | UI | 20 / 26 | 600 | -0.015em |
| Subheading | UI | 17 / 24 | 600 | -0.01em |
| Body | UI | 15 / 22 | 400 | -0.005em |
| Body strong | UI | 15 / 22 | 500 | -0.005em |
| Caption | UI | 13 / 18 | 500 | 0 |
| Micro / code | UI | 11 / 14 | 500 | +0.02em, uppercase only for section labels |

Rules:

- Use the serif for at most two elements per screen, and never for buttons, chips, form labels or numbers.
- Mixing an italic serif word into a headline is allowed once, for warmth (e.g. "Your skills, *translated*").
- BM strings run about 20–30% longer than English, so test every heading in BM.

## Shape, spacing, elevation

- **Grid:** 4px base, with 20px screen side padding.
- **Spacing:** 8 between related items, 16 inside cards, 24 between cards, 32 between sections.
- **Radius:** 10 (chips, small icons), 14 (inputs, list rows), 20 (cards), 28 (hero card, sheets, tab bar), 999 (pills, buttons).
- **Elevation:** keep shadows soft and warm. Never use grey-black blur shadows.
  - `--shadow-1: 0 1px 2px rgba(23,20,15,0.04), 0 2px 8px rgba(23,20,15,0.04)` for cards.
  - `--shadow-2: 0 8px 24px rgba(23,20,15,0.08)` for floating glass and active cards.
  - `--shadow-3: 0 24px 48px rgba(23,20,15,0.14)` for sheets and dialogs.
- **Card borders:** cards sit on the canvas with a hairline border and shadow-1. No heavy outlines and no card-in-card-in-card.

## Glass (chrome only)

Glass is reserved for the top app bar on scroll, the bottom tab bar, the desktop rail and the bottom sheet header. Content cards are solid.

```css
.glass {
  background: var(--glass);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid var(--hairline);
  box-shadow: inset 0 1px 0 var(--glass-edge), var(--shadow-2);
}
@supports not (backdrop-filter: blur(1px)) {
  .glass { background: color-mix(in srgb, var(--surface) 94%, transparent); }
}
```

Glass only reads well over something. Let content scroll beneath the bars, and keep a faint Sunrise wash at the top of Home so the top bar has warmth to blur.

## Iconography and imagery

- **Icons:** Lucide at 1.5px stroke, 20px. Feature icons sit in 36px soft-square tiles (radius 10, `--surface-muted`), as in the reference.
- **Company logos:** placed in 40px rounded tiles on white. Use monogram tiles when there is no logo.
- **No stock photos of smiling graduates.** People appear only as the student's own avatar.
- **Empty states:** a single line illustration in ink-3 plus one sentence and one button.
- **Evidence thumbnails:** 56px rounded previews with a corner status chip.

## Components (signature pieces)

- **Hero card (Home):**
  - Sunrise gradient with a serif headline that changes with state, e.g. "2 partners *want to talk*".
  - One ink pill button, plus a small "Live" chip with icon tiles at the top-left, as in the reference.
- **Next-step card:** solid white, caption-sized label "YOUR NEXT STEP", body-strong action and a trailing arrow button. Only one appears at a time.
- **Partner role card:** logo tile, role (subheading), partner name (caption), RM range (tabular), match % in a small ring, and 2–3 skill chips in muted surface.
- **Locked role card:**
  - The same card frosted over (glass at 40% with blur 8px), with a centred ink pill: lock icon plus "Unlock with good standing".
  - The content shape stays visible so the reward feels real.
- **Skill card:**
  - Name, plus a 3-segment level bar (Foundation, Working, Advanced) filled in ink.
  - Evidence count as a chip, and a rationale in ink-2.
  - Tapping opens a sheet with evidence and actions.
- **Job search log row:** portal tile, role and company, date, evidence thumbnail and status chip (done, pending or attention). Swipe or tap opens the detail sheet.
- **Profile strength:** a thin ring around the avatar in the top bar, plus a fuller ring on the Profile tab.
- **Tabs inside a screen:** a segmented control in a muted pill track, with the selected segment white plus shadow-1.
- **Buttons:**
  - Primary: ink pill, white text, 48px tall.
  - Secondary: white pill with hairline.
  - Tertiary: text with arrow.
  - Never use more than one primary per screen.
- **Inputs:** 52px tall, muted surface, radius 14, floating label, and an ink 1.5px focus ring with 2px offset.

## Motion

- **Duration:** 180–280ms, easing `cubic-bezier(0.2, 0.8, 0.2, 1)`. Sheets use a spring (stiffness 380, damping 34).
- **Skill reveal (onboarding):** skill cards rise 12px and fade in with a 60ms stagger over a slow Sunrise shimmer, ending on a serif headline "We found *14 skills*".
- **Top bar:** the large title cross-fades into the compact bar.
- **Tab change:** content fades in, with no sliding of whole pages.
- **Number changes** (match %, verified count) tick up over 400ms.
- Respect `prefers-reduced-motion`: fades only, no movement.

## Content tone

- Short, warm and direct, addressing the student as "you" (BM: "anda").
- Lead with outcomes, e.g. "Unlocks 9 more roles", rather than system language like "Skill gap identified".
- Repayment copy is always benefit-framed. Never show the word "arrears" or an amount owed on Home or job screens.

## Don'ts

- No purple, blue-violet or rainbow gradients, and no gradient text.
- No glass on content cards, and no more than one gradient surface per screen.
- No emoji as icons, and no 3D blob illustrations.
- No default Tailwind blue/indigo, and no pure #000 or #FFF text on the canvas.
- No government crest bars, centred-everything layouts or form-heavy first screens.
- No dense tables on the student side; lists and cards only.
- No more than two type families (the serif plus the UI sans).

## Agency side (for consistency)

The Agency workspace shares the same tokens and fonts but is desktop-first and denser:

- Frosted left sidebar, as in the reference.
- Body text at 14px, tables allowed, and the serif used only for page titles.
- Sunrise appears only on the Home programme-pulse header.

## Tailwind setup notes

- Define every token above as CSS variables and map them in `tailwind.config` (colours, radius, shadows, fontFamily `display` and `sans`).
- Load Instrument Serif from Google Fonts and Geist from its npm package or CDN, with Inter as the declared fallback.
- Build a `/styleguide` route first, showing type, colours, glass, buttons, chips, cards and the locked state, and get it approved before building screens.
