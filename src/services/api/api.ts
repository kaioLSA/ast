import { api } from './axios'
import type { ApiResponse, PaginatedResponse, QueryParams } from '@/types/global.types'

export async function get<T>(url: string, params?: QueryParams): Promise<ApiResponse<T>> {
  const { data } = await api.get<ApiResponse<T>>(url, { params })
  return data
}

export async function getPaginated<T>(
  url: string,
  params?: QueryParams,
): Promise<PaginatedResponse<T>> {
  const { data } = await api.get<PaginatedResponse<T>>(url, { params })
  return data
}

export async function post<T, P = unknown>(url: string, payload?: P): Promise<ApiResponse<T>> {
  const { data } = await api.post<ApiResponse<T>>(url, payload)
  return data
}

export async function put<T, P = unknown>(url: string, payload?: P): Promise<ApiResponse<T>> {
  const { data } = await api.put<ApiResponse<T>>(url, payload)
  return data
}

export async function patch<T, P = unknown>(url: string, payload?: P): Promise<ApiResponse<T>> {
  const { data } = await api.patch<ApiResponse<T>>(url, payload)
  return data
}

export async function del<T>(url: string): Promise<ApiResponse<T>> {
  const { data } = await api.delete<ApiResponse<T>>(url)
  return data
}
