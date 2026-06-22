import { API_URL } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const res = await fetch(`${API_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      return Response.json(data, { status: res.status })
    }

    const response = Response.json({ user: data.user }, { status: 200 })
    response.headers.set(
      'Set-Cookie',
      `access_token=${data.access}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
    )
    response.headers.append(
      'Set-Cookie',
      `refresh_token=${data.refresh}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
    )

    return response
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
