export type ID = string

export type Timestamp = string | Date

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export type AsyncFn<T = void> = () => Promise<T>

export type ValueOf<T> = T[keyof T]

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type ApiResponse<T> = {
  data: T
  message: string
  success: boolean
  statusCode: number
}

export type ApiError = {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}

export type SortDirection = 'asc' | 'desc'

export type SortConfig<T> = {
  key: keyof T
  direction: SortDirection
}

export type FilterConfig = Record<string, string | number | boolean | string[]>

export type PaginationParams = {
  page: number
  pageSize: number
}

export type QueryParams = PaginationParams & {
  sort?: string
  order?: SortDirection
  search?: string
  filters?: FilterConfig
}

export type Status = 'idle' | 'loading' | 'success' | 'error'

export type Theme = 'dark' | 'light' | 'system'

export type Locale = 'pt-BR' | 'en-US' | 'es-ES'

export type Currency = 'BRL' | 'USD' | 'EUR'

export type DateRange = {
  from: Date
  to: Date
}

export type SelectOption<T = string> = {
  label: string
  value: T
  icon?: string
  disabled?: boolean
}

export type TableColumn<T> = {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
  width?: string | number
  align?: 'left' | 'center' | 'right'
}

export type MenuItem = {
  id: string
  label: string
  href: string
  icon?: React.ComponentType
  badge?: string | number
  children?: MenuItem[]
  permission?: string
}

export type Breadcrumb = {
  label: string
  href?: string
}
