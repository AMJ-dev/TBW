import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'
import { api_url } from '@/lib/constants'

declare module 'axios' {
    interface AxiosRequestConfig {
        showLoading?: boolean
    }
    interface InternalAxiosRequestConfig {
        showLoading?: boolean
    }
}

type LoadingListener = (loading: boolean) => void

export interface Resp {
    status: number
    error: boolean
    success: boolean
    message: string
    data: any
    meta?: any
    code: any
}

let listeners = new Set<LoadingListener>()
let active = 0
const notify = () => listeners.forEach(fn => fn(active > 0))

export const onLoadingChange = (fn: (isLoading: boolean) => void): (() => void) => {
    listeners.add(fn)
    return () => listeners.delete(fn)
}

export const http: AxiosInstance = axios.create({
    baseURL: api_url,
    withCredentials: true,
    headers: {    
        "Content-Type": "multipart/form-data",
        "Accept": "application/json"
    }
})

axiosRetry(http, {
    retries: 3,
    retryDelay: c => c * 1000,
    retryCondition: err => {
        const code = (err as any).code || ''
        const status = err.response?.status
        
        const method = err.config?.method?.toUpperCase()
        if (method && method !== 'GET') return false
        if (status && status >= 500) return true
        if (code === 'ECONNABORTED') return true
        return axiosRetry.isNetworkError(err) || axiosRetry.isRetryableError(err)
    }
})

http.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
    if (cfg.showLoading !== false) {
        active += 1
        notify()
    }
    return cfg
}, e => Promise.reject(e))

http.interceptors.response.use(
    (res: AxiosResponse) => {
        if ((res.config as AxiosRequestConfig).showLoading !== false) {
            active = Math.max(0, active - 1)
            notify()
        }
        return res
    },
    err => {
        const cfg = err.config as AxiosRequestConfig | undefined
        if (cfg?.showLoading !== false) {
            active = Math.max(0, active - 1)
            notify()
        }

        if (err.response) {
            const status = err.response.status
            const responseData = err.response.data

            if (status === 401 || status === 403 || status === 405) {
                if (status === 403 && responseData?.code === 'ACCOUNT_SUSPENDED') {
                    console.log('Account is suspended:', responseData.data)
                    window.location.href = '/account-suspended'
                } else if (status === 405) {
                    console.log('Invalid token / Method Not Allowed:', responseData?.data)
                    // window.location.href = '/unauthorized'
                }
            }
        }
        return Promise.reject(err)
    }
)

export const withNoLoading: AxiosRequestConfig = {
    showLoading: false
}