import axios from 'axios'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
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

export async function apiRoute(path: string, request: Request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = cookieHeader.split('; ').find(c => c.startsWith('access_token='))?.split('=')[1]

  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  const normalizedPath = path.replace(/\/+$/, '')
  const url = `${API_URL}/api/${normalizedPath}/`
  const body = request.body ? await request.text() : undefined

  const res = await fetch(url, {
    method: request.method,
    headers,
    body,
  })

  const responseHeaders: Record<string, string> = {}
  res.headers.forEach((value, key) => {
    if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key)) {
      responseHeaders[key] = value
    }
  })

  if (res.status === 401) {
    responseHeaders['Set-Cookie'] = 'access_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  }

  return new Response(await res.text(), {
    status: res.status,
    headers: responseHeaders,
  })
}
