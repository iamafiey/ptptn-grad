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
    fontFamily: {
      display: v('font-display'),
      sans: v('font-sans'),
    },
    extend: {
      borderRadius: {
        chip: v('radius-chip'),
        input: v('radius-input'),
        card: v('radius-card'),
        hero: v('radius-hero'),
      },
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
