"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Package, ShoppingCart, Warehouse, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/hooks/use-mobile"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)
  const { logout } = useAuth()

  const navigation = [
    {
      name: "Склады",
      href: "/dashboard/warehouses",
      icon: Warehouse,
      current: pathname.includes("/dashboard/warehouses"),
    },
    {
      name: "Товары",
      href: "/dashboard/products",
      icon: Package,
      current: pathname.includes("/dashboard/products"),
    },
    {
      name: "Заказы",
      href: "/dashboard/orders",
      icon: ShoppingCart,
      current: pathname.includes("/dashboard/orders"),
    },
  ]

  const NavItems = () => (
    <>
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
            item.current
              ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
          )}
          onClick={() => setOpen(false)}
        >
          <item.icon className="h-5 w-5" />
          {item.name}
        </Link>
      ))}
    </>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center border-b px-4">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                  <LayoutDashboard className="h-6 w-6" />
                  <span>Система управления</span>
                </Link>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <nav className="grid gap-2 p-4">
                <NavItems />
              </nav>
              <div className="mt-auto p-4">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  Выйти
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="h-6 w-6" />
            <span className="hidden md:inline-block">Система управления</span>
          </Link>
        </div>
        <nav className="hidden md:flex flex-1 items-center gap-4 justify-center">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors",
                item.current
                  ? "text-gray-900 dark:text-gray-50"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" className="hidden md:flex gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
