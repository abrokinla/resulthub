import axios from 'axios'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/)
    if (match) {
      config.headers.Authorization = `Bearer ${match[1]}`
    }
  }
  return config
})

const publicPaths = ['/login', '/signup', '/access']

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error - pass through
      return Promise.reject(error)
    }

    const status = error.response.status
    const errorData = error.response.data || {}
    const errorType = errorData.error_type || errorData.detail?.error_type

    if (typeof window === 'undefined') {
      return Promise.reject(error)
    }

    const currentPath = window.location.pathname
    const isPublicPath = publicPaths.some(
      (p) => currentPath === p || currentPath.startsWith(p + '/')
    )

    // Only redirect to login on token expiry, not on other 401 errors
    if (status === 401 && !isPublicPath) {
      // If the error is specifically token_expired, it means middleware/route handler
      // failed to refresh it, so we should redirect to login
      if (errorType === 'token_expired' || errorData.detail === 'Token expired' || !errorType) {
        // Unknown 401 or explicit token expiry - redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
      // For other error types (invalid_credentials, permission_denied, etc),
      // don't redirect - let the component handle the error display
    }

    return Promise.reject(error)
  }
)

export function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

interface ApiOptions {
  token?: string
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

export async function apiServer(path: string, options: ApiOptions = {}) {
  const { token, method, body, headers: extraHeaders } = options
  const headers: Record<string, string> = {
    ...extraHeaders,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const [basePath, queryString] = path.split('?')
  const normalizedPath = basePath.replace(/\/+$/, '')
  const url = `${API_URL}/api/${normalizedPath}/${queryString ? '?' + queryString : ''}`
  const res = await fetch(url, {
    method: method || 'GET',
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || `API error: ${res.status}`)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

function getCookieValue(cookieHeader: string, name: string): string | null {
  return cookieHeader.split('; ').find(c => c.startsWith(`${name}=`))?.split('=')[1] || null
}

function setCookieHeader(name: string, value: string, maxAge: number): string {
  const httpOnly = name === 'refresh_token' ? 'HttpOnly; ' : ''
  return `${name}=${value}; Path=/; ${httpOnly}Secure; SameSite=Lax; Max-Age=${maxAge}`
}

function clearCookieHeader(name: string): string {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

async function doFetch(url: string, method: string, headers: Record<string, string>, body?: string | ArrayBuffer) {
  const res = await fetch(url, { method, headers, body })
  const responseHeaders: Record<string, string> = {}
  res.headers.forEach((value, key) => {
    if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key)) {
      responseHeaders[key] = value
    }
  })
  return { res, responseHeaders }
}

export async function apiRoute(path: string, request: Request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = getCookieValue(cookieHeader, 'access_token')
  const refreshToken = getCookieValue(cookieHeader, 'refresh_token')

  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader && !headers['Authorization']) {
    headers['Authorization'] = authHeader
  }

  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  const urlObj = new URL(request.url)
  const qs = urlObj.searchParams.toString()
  const [basePath] = path.split('?')
  const normalizedPath = basePath.replace(/\/+$/, '')
  const url = `${API_URL}/api/${normalizedPath}/${qs ? '?' + qs : ''}`
  const body = request.body ? await request.arrayBuffer() : undefined

  const { res, responseHeaders } = await doFetch(url, request.method, headers, body)

  // Non-401 responses pass through
  if (res.status !== 401) {
    return new Response(await res.text(), { status: res.status, headers: responseHeaders })
  }

  // 401 response - check if it's token expiry before attempting refresh
  let resText = ''
  let errorData: any = {}

  try {
    resText = await res.text()
    if (resText) {
      errorData = JSON.parse(resText)
    }
  } catch {
    // If we can't parse, treat as unknown error
    resText = ''
  }

  const errorType = errorData.error_type || errorData.detail?.error_type
  const isTokenExpired = errorType === 'token_expired' || errorData.detail === 'Token expired'

  // Only attempt refresh if it's explicitly a token_expired error
  // For other 401s (invalid credentials, permission denied, etc), return as-is
  if (!isTokenExpired || !refreshToken) {
    const h = new Headers(responseHeaders)
    if (!refreshToken) {
      h.append('Set-Cookie', clearCookieHeader('access_token'))
      h.append('Set-Cookie', clearCookieHeader('refresh_token'))
    }
    return new Response(resText || JSON.stringify(errorData), { status: 401, headers: h })
  }

  // Attempt token refresh for token_expired errors
  let newAccessToken: string | null = null
  try {
    const refreshRes = await fetch(`${API_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })
    const refreshData = await refreshRes.json()
    if (refreshRes.ok && refreshData.access) {
      newAccessToken = refreshData.access
    }
  } catch {
    // Refresh failed - will clear cookies below
  }

  if (!newAccessToken) {
    const h = new Headers(responseHeaders)
    h.append('Set-Cookie', clearCookieHeader('access_token'))
    h.append('Set-Cookie', clearCookieHeader('refresh_token'))
    return new Response(resText || JSON.stringify(errorData), { status: 401, headers: h })
  }

  // Retry original request with new token
  headers['Authorization'] = `Bearer ${newAccessToken}`
  const retry = await doFetch(url, request.method, headers, body)
  const merged = new Headers(retry.responseHeaders)
  merged.set('Set-Cookie', setCookieHeader('access_token', newAccessToken, 3600))
  return new Response(await retry.res.text(), {
    status: retry.res.status,
    headers: merged,
  })
}