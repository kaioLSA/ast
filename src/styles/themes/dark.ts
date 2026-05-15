export const darkTheme = {
  name: 'dark',
  colors: {
    background: 'hsl(222, 47%, 7%)',
    surface: 'hsl(222, 47%, 10%)',
    surfaceHover: 'hsl(222, 47%, 13%)',
    border: 'hsl(217, 32%, 17%)',
    borderHover: 'hsl(217, 32%, 25%)',
    text: {
      primary: 'hsl(210, 40%, 98%)',
      secondary: 'hsl(215, 20%, 65%)',
      muted: 'hsl(215, 16%, 47%)',
    },
    primary: {
      DEFAULT: 'hsl(217, 91%, 60%)',
      foreground: 'hsl(222, 47%, 7%)',
      hover: 'hsl(217, 91%, 55%)',
    },
    accent: {
      cyan: '#00d4ff',
      purple: '#8b5cf6',
      green: '#10b981',
    },
  },
} as const
