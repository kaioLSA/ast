import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { STORAGE_KEYS } from '@/lib/constants/app'
import { getLocalStorage, setLocalStorage, clearAuthStorage } from '@/lib/helpers/storage'

export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL + '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getLocalStorage<string>(STORAGE_KEYS.AUTH_TOKEN)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = getLocalStorage<string>(STORAGE_KEYS.REFRESH_TOKEN)

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/refresh`,
            { refreshToken },
          )
          setLocalStorage(STORAGE_KEYS.AUTH_TOKEN, data.accessToken)
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return api(original)
        } catch {
          clearAuthStorage()
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  },
)
