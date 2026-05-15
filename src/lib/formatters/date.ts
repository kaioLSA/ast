import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return '-'
  return format(parsed, pattern, { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}

export function formatRelative(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return '-'
  return formatDistanceToNow(parsed, { addSuffix: true, locale: ptBR })
}

export function formatTime(date: string | Date): string {
  return formatDate(date, 'HH:mm')
}
