import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Проверяем наличие сессии Django
  const sessionCookie = request.cookies.get("sessionid")
  const csrfCookie = request.cookies.get("csrftoken")
  
  console.log("=== Middleware Check ===")
  console.log("Current path:", request.nextUrl.pathname)
  console.log("Session cookie:", sessionCookie?.value)
  console.log("CSRF cookie:", csrfCookie?.value)
  
  // Проверяем не только наличие, но и валидность sessionid
  const isAuthenticated = !!sessionCookie?.value && sessionCookie.value.length > 0

  // Если пользователь не аутентифицирован и пытается получить доступ к защищенным маршрутам
  if (!isAuthenticated && request.nextUrl.pathname.startsWith("/dashboard")) {
    console.log("Redirecting to login from:", request.nextUrl.pathname)
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Если пользователь аутентифицирован и пытается получить доступ к странице входа
  if (isAuthenticated && request.nextUrl.pathname === "/login") {
    console.log("Redirecting to dashboard from login page")
    return NextResponse.redirect(new URL("/dashboard/warehouses", request.url))
  }

  // Если пользователь аутентифицирован и находится на главной странице
  if (isAuthenticated && request.nextUrl.pathname === "/") {
    console.log("Redirecting to dashboard from root")
    return NextResponse.redirect(new URL("/dashboard/warehouses", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
  ],
} 