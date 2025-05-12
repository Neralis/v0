"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { Order, getOrderById, updateOrderStatus, cancelOrder } from "@/lib/api/orders"
import { toast } from "sonner"
import { getSingleOrderReport } from "@/lib/api/reports"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = Number(params.id)

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderById(orderId)
        setOrder(data)
      } catch (err) {
        setError("Ошибка при загрузке заказа")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (isLoading) {
    return <div>Загрузка...</div>
  }

  if (error || !order) {
    return <div className="text-red-500">{error || "Заказ не найден"}</div>
  }

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "cancelled") {
      setIsCancelDialogOpen(true)
      return
    }

    setIsUpdating(true)
    try {
      const updatedOrder = await updateOrderStatus(order.id, { status: newStatus })
      setOrder(updatedOrder)
      toast.success("Статус заказа обновлен")
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error)
      toast.error("Произошла ошибка при обновлении статуса заказа")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Пожалуйста, укажите причину отмены заказа")
      return
    }

    setIsUpdating(true)
    try {
      const updatedOrder = await cancelOrder(order.id, cancelReason)
      setOrder(updatedOrder)
      setIsCancelDialogOpen(false)
      setCancelReason("")
      toast.success("Заказ успешно отменен")
      
      // Перезагружаем данные заказа
      const refreshedOrder = await getOrderById(order.id)
      setOrder(refreshedOrder)
    } catch (error) {
      console.error("Ошибка при отмене заказа:", error)
      toast.error("Произошла ошибка при отмене заказа")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDownloadReport = async () => {
    setIsDownloadingReport(true)
    try {
      const blob = await getSingleOrderReport(orderId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `order_report_${orderId}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Отчет успешно скачан")
    } catch (error) {
      console.error("Ошибка при скачивании отчета:", error)
      toast.error("Произошла ошибка при скачивании отчета")
    } finally {
      setIsDownloadingReport(false)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Назад</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Заказ #{order.id}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{new Date(order.created_at).toLocaleDateString()}</span>
            {getStatusBadge(order.status)}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Статус:</span>
            <Select value={order.status} onValueChange={handleStatusChange} disabled={isUpdating}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Новый</SelectItem>
                <SelectItem value="processing">В обработке</SelectItem>
                <SelectItem value="shipped">Отправлен</SelectItem>
                <SelectItem value="completed">Завершен</SelectItem>
                <SelectItem value="cancelled">Отменить заказ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            onClick={handleDownloadReport}
            disabled={isDownloadingReport}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloadingReport ? "Скачивание..." : "Скачать отчет"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Товары в заказе</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Количество</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/products/${item.product_id}`} className="text-blue-600 hover:underline">
                          {item.name}
                        </Link>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.price.toLocaleString('ru-RU')} ₽</TableCell>
                      <TableCell>{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">Итого:</TableCell>
                    <TableCell className="font-bold">{order.total_price.toLocaleString('ru-RU')} ₽</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Информация о заказе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium mb-1">Клиент</div>
                <div className="text-sm text-muted-foreground">{order.client_name}</div>
              </div>
              <Separator />
              <div>
                <div className="font-medium mb-1">Адрес доставки</div>
                <div className="text-sm text-muted-foreground">{order.destination_address}</div>
              </div>
              <Separator />
              <div>
                <div className="font-medium mb-1">Склад</div>
                <div className="text-sm text-muted-foreground">Склад #{order.warehouse}</div>
              </div>
              <Separator />
              {order.comment && (
                <>
                  <div>
                    <div className="font-medium mb-1">Комментарий</div>
                    <div className="text-sm text-muted-foreground">{order.comment}</div>
                  </div>
                  <Separator />
                </>
              )}
              {order.status === 'cancelled' && (
                <>
                  <div>
                    <div className="font-medium mb-1 text-red-500">Причина отмены</div>
                    <div className="text-sm text-red-400">
                      {order.cancellation_reason || 'Причина не указана'}
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              {order.qr_code && (
                <>
                  <div>
                    <div className="font-medium mb-1">QR-код</div>
                    <img 
                      src={`http://127.0.0.1:8000${order.qr_code}`} 
                      alt={`QR-код заказа #${order.id}`}
                      className="w-32 h-32"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отмена заказа #{order.id}</DialogTitle>
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
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelOrder}
              disabled={isUpdating}
            >
              {isUpdating ? "Отмена..." : "Отменить заказ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

