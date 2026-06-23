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

  const normalizedPath = path.replace(/\/+$/, '')
  const res = await fetch(`${API_URL}/api/${normalizedPath}/`, {
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
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
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

  const normalizedPath = path.replace(/\/+$/, '')
  const url = `${API_URL}/api/${normalizedPath}/`
  const body = request.body ? await request.arrayBuffer() : undefined

  const { res, responseHeaders } = await doFetch(url, request.method, headers, body)

  if (res.status !== 401) {
    return new Response(await res.text(), { status: res.status, headers: responseHeaders })
  }

  if (!refreshToken) {
    const h = new Headers(responseHeaders)
    h.append('Set-Cookie', clearCookieHeader('access_token'))
    h.append('Set-Cookie', clearCookieHeader('refresh_token'))
    return new Response(await res.text(), { status: 401, headers: h })
  }

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
    // refresh failed
  }

  if (!newAccessToken) {
    const h = new Headers(responseHeaders)
    h.append('Set-Cookie', clearCookieHeader('access_token'))
    h.append('Set-Cookie', clearCookieHeader('refresh_token'))
    return new Response(await res.text(), { status: 401, headers: h })
  }

  headers['Authorization'] = `Bearer ${newAccessToken}`
  const retry = await doFetch(url, request.method, headers, body)
  const merged = new Headers(retry.responseHeaders)
  merged.set('Set-Cookie', setCookieHeader('access_token', newAccessToken, 3600))
  return new Response(await retry.res.text(), {
    status: retry.res.status,
    headers: merged,
  })
}
