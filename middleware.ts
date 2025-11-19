import { NextResponse } from 'next/server'

export function middleware() {
  // Auth checks disabled: always allow the request through
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
}


