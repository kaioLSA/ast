export const routes = {
  auth: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
  dashboard: '/dashboard',
  clients: '/clients',
  automations: '/automations',
  meetings: '/meetings',
  leads: {
    root: '/leads',
    detail: (id: string) => `/leads/${id}`,
    kanban: '/leads/kanban',
  },
  whatsapp: '/whatsapp',
  ai: '/ai',
  analytics: '/analytics',
  finance: {
    root: '/finance',
    invoices: '/finance/invoices',
    transactions: '/finance/transactions',
    subscriptions: '/finance/subscriptions',
  },
  calendar: '/calendar',
  reports: '/reports',
  tasks: '/tasks',
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
  '/clear-session',
]

export const protectedRoutes = [
  routes.dashboard,
  routes.clients,
  routes.automations,
  routes.meetings,
  routes.leads.root,
  routes.whatsapp,
  routes.ai,
  routes.analytics,
  routes.finance.root,
  routes.calendar,
  routes.reports,
  routes.tasks,
  routes.settings.root,
  routes.team,
]
