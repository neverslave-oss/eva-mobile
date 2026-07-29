// Kernel Mobile v2 — Design System
// Mirrors the v1 Telegram-style dark theme (see app.css + Blade views)

export const colors = {
  // Backgrounds
  bgPrimary: '#0f0f1a',
  bgSecondary: '#16162a',
  bgCard: '#17212b',
  bgSurface: '#1e1e30',
  bgHover: '#1a2332',
  bgInput: '#242f3d',
  bgBubbleBot: '#1e1e30',
  bgBubbleUser: '#58a6ff',

  // Borders
  border: '#2a2a40',
  borderSubtle: '#1e1e30',
  borderLight: '#30363d',

  // Text
  textPrimary: '#e4e4e7',
  textSecondary: '#8b949e',
  textMuted: '#6c7883',
  textDim: '#484860',

  // Accents
  accent: '#58a6ff',
  accentHover: '#4a9eff',
  accentBg: '#242f3d',

  // Status
  success: '#3fb950',
  danger: '#f85149',
  warning: '#d29922',
  purple: '#bc8cff',

  // Gradients
  gradientOnline: ['#1a6ed8', '#58a6ff'] as const,
  gradientOffline: ['#2a2a40', '#3a3a50'] as const,
  gradientBot: ['#58a6ff', '#bc8cff'] as const,
  gradientUser: ['#1a6ed8', '#58a6ff'] as const,

  // Buttons
  buttonPrimary: '#1a6ed8',
  buttonSuccess: '#238636',
  buttonHiDanger: '#f85149',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const typography = {
  h1: { fontSize: 22, fontWeight: '700' as const, color: colors.textPrimary },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.textPrimary },
  title: { fontSize: 16, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 14, color: colors.textPrimary },
  caption: { fontSize: 12, color: colors.textSecondary },
  small: { fontSize: 11, color: colors.textSecondary },
  tiny: { fontSize: 10, color: colors.textMuted },
  label: { fontSize: 10, color: colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' as const },
} as const;

export const borderRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  full: 9999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
} as const;
