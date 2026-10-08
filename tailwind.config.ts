import type { Config } from 'tailwindcss'

const v = (name: string) => `var(--${name})`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    // Replace (not extend) colours so default Tailwind blue/indigo are unavailable.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      canvas: v('canvas'),
      surface: v('surface'),
      'surface-muted': v('surface-muted'),
      ink: v('ink'),
      'ink-2': v('ink-2'),
      'ink-3': v('ink-3'),
      'on-ink': v('on-ink'),
      hairline: v('hairline'),
      glass: v('glass'),
      'glass-edge': v('glass-edge'),
      done: { DEFAULT: v('signal-done'), ink: v('signal-done-ink') },
      pending: { DEFAULT: v('signal-pending'), ink: v('signal-pending-ink') },
      attention: { DEFAULT: v('signal-attention'), ink: v('signal-attention-ink') },
      info: { DEFAULT: v('signal-info'), ink: v('signal-info-ink') },
    },
    // Replaces Tailwind's scale so nothing can exceed 8px. `circle` is only for true circles
    // (avatars, status dots, progress rings, the sheet handle), never for buttons or cards.
    borderRadius: {
      none: '0',
      sm: '2px',
      DEFAULT: v('radius-control'),
      chip: v('radius-chip'),
      control: v('radius-control'),
      input: v('radius-control'),
      card: v('radius-card'),
      hero: v('radius-hero'),
      circle: '9999px',
    },
    fontFamily: {
      sans: v('font-sans'),
    },
    extend: {
      boxShadow: {
        1: v('shadow-1'),
        2: v('shadow-2'),
        3: v('shadow-3'),
      },
      backgroundImage: {
        sunrise: v('sunrise'),
        'sunrise-wash': v('sunrise-wash'),
      },
      transitionTimingFunction: { app: v('ease') },
      spacing: { 'safe-top': v('safe-top'), 'safe-bottom': v('safe-bottom') },
      maxWidth: { app: '430px' },
    },
  },
} satisfies Config
