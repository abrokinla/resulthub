import { apiRoute } from '@/lib/api'

export async function GET(request: Request) {
  return apiRoute('auth/me/', request)
}
