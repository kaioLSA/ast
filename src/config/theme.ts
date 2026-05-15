export const themeConfig = {
  defaultTheme: 'dark' as const,
  storageKey: 'startsette-theme',
  colors: {
    primary: 'hsl(217, 91%, 60%)',
    secondary: 'hsl(215, 16%, 47%)',
    accent: 'hsl(191, 100%, 50%)',
    background: 'hsl(222, 47%, 7%)',
    surface: 'hsl(222, 47%, 11%)',
    border: 'hsl(217, 32%, 17%)',
  },
  fonts: {
    sans: 'Inter',
    mono: 'JetBrains Mono',
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  shadows: {
    card: '0 1px 3px rgba(0,0,0,0.3)',
    modal: '0 25px 50px rgba(0,0,0,0.5)',
    glow: '0 0 20px rgba(59, 130, 246, 0.4)',
  },
}
