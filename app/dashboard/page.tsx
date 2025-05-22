"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Warehouse, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { getWarehouses } from "@/lib/api/warehouses"
import { getProducts } from "@/lib/api/products"
import { getOrders } from "@/lib/api/orders"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Stats {
  warehouses: number
  products: number
  orders: number
  newOrders: number
  processingOrders: number
  completedOrders: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<Stats>({
    warehouses: 0,
    products: 0,
    orders: 0,
    newOrders: 0,
    processingOrders: 0,
    completedOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user.is_authenticated) {
      router.push("/login")
    }
  }, [loading, user.is_authenticated, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [warehouses, products, orders] = await Promise.all([
          getWarehouses(),
          getProducts(),
          getOrders()
        ])

        // Подсчет статистики по заказам
        const newOrders = orders.filter(order => order.status === 'new').length
        const processingOrders = orders.filter(order => order.status === 'processing').length
        const completedOrders = orders.filter(order => order.status === 'completed').length

        // Получаем последние 5 заказов
        const sortedOrders = [...orders].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 5)

        setStats({
          warehouses: warehouses.length,
          products: products.length,
          orders: orders.length,
          newOrders,
          processingOrders,
          completedOrders
        })
        setRecentOrders(sortedOrders)
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-500">Новый</Badge>
      case "processing":
        return <Badge className="bg-yellow-500">В обработке</Badge>
      case "shipped":
        return <Badge className="bg-purple-500">Отправлен</Badge>
      case "completed":
        return <Badge className="bg-green-500">Завершен</Badge>
      case "cancelled":
        return <Badge className="bg-red-500">Отменен</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    )
  }

  if (!user.is_authenticated) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Панель управления</h1>
        <p className="text-muted-foreground">
          Добро пожаловать, {user.username}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-accent" onClick={() => router.push("/dashboard/warehouses")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Склады</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.warehouses}</div>
            <p className="text-xs text-muted-foreground">
              Всего складов в системе
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => router.push("/dashboard/products")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Товары</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
            <p className="text-xs text-muted-foreground">
              Всего товаров в каталоге
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => router.push("/dashboard/orders")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Заказы</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
            <p className="text-xs text-muted-foreground">
              Всего заказов в системе
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Новые заказы</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newOrders}</div>
            <p className="text-xs text-muted-foreground">
              Требуют обработки
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В обработке</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Находятся в работе
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Завершено</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Успешно выполнено
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Последние заказы</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                >
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>{order.client_name}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 