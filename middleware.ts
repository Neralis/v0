import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Заглушка для middleware
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
  ],
} 