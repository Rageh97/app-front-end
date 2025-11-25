// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const lang = request.cookies.get('i18next')?.value || 'en'
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  const response = NextResponse.next()

  response.headers.set('x-lang', lang)
  response.headers.set('x-dir', dir)

  return response
}
