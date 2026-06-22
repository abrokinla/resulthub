export async function POST() {
  const response = Response.json({ message: 'Logged out' }, { status: 200 })
  response.headers.set('Set-Cookie', 'access_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0')
  response.headers.append('Set-Cookie', 'refresh_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0')
  return response
}
