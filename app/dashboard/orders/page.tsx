"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, Download, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Order, getOrders, cancelOrder } from "@/lib/api/orders"
import { toast } from "sonner"

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [sortField, setSortField] = useState<keyof Order | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrders()
        setOrders(data)
      } catch (err) {
        setError("Ошибка при загрузке заказов")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedOrders = [...orders].sort((a, b) => {
    if (!sortField) return 0

    const aValue = a[sortField]
    const bValue = b[sortField]

    if (aValue === null || bValue === null) return 0

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleDownloadReport = async () => {
    try {
      // Здесь можно добавить вызов API для получения отчета
      alert("Отчет по всем заказам будет скачан")
    } catch (error) {
      console.error("Ошибка при скачивании отчета:", error)
      alert("Произошла ошибка при скачивании отчета")
    }
  }

  const handleCancelClick = (orderId: number) => {
    setSelectedOrderId(orderId)
    setIsCancelDialogOpen(true)
  }

  const handleCancelOrder = async () => {
    if (!selectedOrderId || !cancelReason.trim()) {
      toast.error("Пожалуйста, укажите причину отмены заказа")
      return
    }

    try {
      await cancelOrder(selectedOrderId, cancelReason)
      // Обновляем список заказов после отмены
      const updatedOrders = await getOrders()
      setOrders(updatedOrders)
      setIsCancelDialogOpen(false)
      setCancelReason("")
      setSelectedOrderId(null)
      toast.success("Заказ успешно отменен")
    } catch (error) {
      console.error("Ошибка при отмене заказа:", error)
      toast.error("Произошла ошибка при отмене заказа")
    }
  }

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

  if (isLoading) {
    return <div>Загрузка...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Заказы</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Скачать отчет
          </Button>
          <Button onClick={() => router.push("/dashboard/orders/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Создать заказ
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список заказов</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("id")}>
                    ID заказа
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("created_at")}>
                    Дата создания
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("warehouse")}>
                    Склад
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("status")}>
                    Статус
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Товары</TableHead>
                <TableHead>QR-код</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>Склад #{order.warehouse}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <ul className="list-disc list-inside">
                      {order.items.map((item, index) => (
                        <li key={index}>
                          {item.name} x {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell>
                    {order.qr_code && (
                      <img 
                        src={`http://127.0.0.1:8000${order.qr_code}`} 
                        alt={`QR-код заказа #${order.id}`}
                        className="w-16 h-16"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          Подробнее
                        </Button>
                      </Link>
                      {order.status === 'new' && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleCancelClick(order.id)}
                        >
                          Отменить
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отмена заказа #{selectedOrderId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Причина отмены</label>
              <Textarea
                placeholder="Укажите причину отмены заказа"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCancelDialogOpen(false)
              setCancelReason("")
              setSelectedOrderId(null)
            }}>
              Отмена
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelOrder}
            >
              Отменить заказ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
