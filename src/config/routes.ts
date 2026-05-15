export const routes = {
  auth: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
  dashboard: '/dashboard',
  leads: {
    root: '/leads',
    detail: (id: string) => `/leads/${id}`,
    kanban: '/leads/kanban',
  },
  campaigns: {
    root: '/campaigns',
    detail: (id: string) => `/campaigns/${id}`,
    meta: '/campaigns/meta-ads',
    google: '/campaigns/google-ads',
    tiktok: '/campaigns/tiktok-ads',
  },
  automations: '/automations',
  ai: '/ai',
  whatsapp: '/whatsapp',
  analytics: '/analytics',
  finance: {
    root: '/finance',
    invoices: '/finance/invoices',
    transactions: '/finance/transactions',
    subscriptions: '/finance/subscriptions',
  },
  calendar: '/calendar',
  reports: '/reports',
  settings: {
    root: '/settings',
    profile: '/settings/profile',
    team: '/settings/team',
    integrations: '/settings/integrations',
    billing: '/settings/billing',
  },
  team: '/team',
} as const

export const publicRoutes = [
  routes.auth.login,
  routes.auth.register,
  routes.auth.forgotPassword,
  routes.auth.resetPassword,
]

export const protectedRoutes = [
  routes.dashboard,
  routes.leads.root,
  routes.campaigns.root,
  routes.automations,
  routes.ai,
  routes.whatsapp,
  routes.analytics,
  routes.finance.root,
  routes.calendar,
  routes.reports,
  routes.settings.root,
  routes.team,
]
