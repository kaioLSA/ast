export const APP_NAME = 'Startsette'
export const APP_VERSION = '1.0.0'

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

export const DEBOUNCE_DELAY = 300

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const STORAGE_KEYS = {
  THEME: 'startsette-theme',
  SIDEBAR_COLLAPSED: 'startsette-sidebar',
  AUTH_TOKEN: 'startsette-token',
  REFRESH_TOKEN: 'startsette-refresh',
} as const

export const QUERY_STALE_TIME = 5 * 60 * 1000 // 5 min
export const QUERY_CACHE_TIME = 30 * 60 * 1000 // 30 min
