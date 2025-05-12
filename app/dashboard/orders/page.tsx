"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, Download, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Order, getOrders, cancelOrder } from "@/lib/api/orders"
import { getWarehouseById } from "@/lib/api/warehouses"
import { toast } from "sonner"
import React from "react"
import { Label } from "@/components/ui/label"

interface WarehouseInfo {
  id: number
  name: string
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [warehouses, setWarehouses] = useState<Record<number, WarehouseInfo>>({})
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [sortField, setSortField] = useState<keyof Order>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const ordersData = await getOrders()
      setOrders(ordersData)

      // Загружаем информацию о складах
      const warehousePromises = ordersData.map((order) => getWarehouseById(order.warehouse))
      const warehousesData = await Promise.all(warehousePromises)
      const warehousesMap = warehousesData.reduce((acc, warehouse) => {
        acc[warehouse.id] = warehouse
        return acc
      }, {} as Record<number, WarehouseInfo>)
      setWarehouses(warehousesMap)
    } catch (error) {
      console.error("Ошибка при загрузке заказов:", error)
      toast.error("Не удалось загрузить заказы")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (field: keyof Order) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedOrders = [...orders].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  const handleCancelOrder = async () => {
    if (!selectedOrderId) return

    try {
      await cancelOrder(selectedOrderId, cancelReason)
      toast.success("Заказ успешно отменен")
      setCancelDialogOpen(false)
      setCancelReason("")
      loadOrders()
    } catch (error) {
      console.error("Ошибка при отмене заказа:", error)
      toast.error("Не удалось отменить заказ")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      new: "bg-blue-500",
      processing: "bg-yellow-500",
      shipped: "bg-purple-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
    }

    const statusLabels: Record<string, string> = {
      new: "Новый",
      processing: "В обработке",
      shipped: "Отправлен",
      delivered: "Доставлен",
      cancelled: "Отменен",
    }

    return (
      <Badge className={statusColors[status] || "bg-gray-500"}>
        {statusLabels[status] || status}
      </Badge>
    )
  }

  const toggleOrder = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Заказы</h1>
        <Button onClick={() => router.push("/dashboard/orders/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Создать заказ
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список заказов</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("id")}
                      className="flex items-center gap-1"
                    >
                      ID
                      {sortField === "id" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1"
                    >
                      Статус
                      {sortField === "status" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Склад</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("client_name")}
                      className="flex items-center gap-1"
                    >
                      Клиент
                      {sortField === "client_name" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Адрес доставки</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("total_price")}
                      className="flex items-center gap-1"
                    >
                      Сумма
                      {sortField === "total_price" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1"
                    >
                      Дата создания
                      {sortField === "created_at" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleOrder(order.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {expandedOrders.has(order.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          #{order.id}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{warehouses[order.warehouse]?.name || "Неизвестный склад"}</TableCell>
                      <TableCell>{order.client_name}</TableCell>
                      <TableCell>{order.destination_address}</TableCell>
                      <TableCell>{order.total_price.toLocaleString()} ₽</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/orders/${order.id}`)
                            }}
                          >
                            Детали
                          </Button>
                          {order.status !== "cancelled" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedOrderId(order.id)
                                setCancelDialogOpen(true)
                              }}
                            >
                              Отменить
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedOrders.has(order.id) && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/30">
                          <div className="p-4">
                            <h4 className="font-medium mb-2">Товары в заказе:</h4>
                            <ul className="space-y-2">
                              {order.items.map((item, index) => (
                                <li key={`${order.id}-${item.product_id}-${index}`} className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Link 
                                      href={`/dashboard/products/${item.product_id}`}
                                      className="text-primary hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {item.name}
                                    </Link>
                                    <span className="text-muted-foreground">({item.quantity} шт.)</span>
                                  </div>
                                  <div className="h-4 w-px bg-border mx-2" />
                                  <div className="flex flex-col">
                                    <span className="text-muted-foreground text-sm">{item.price.toLocaleString()} ₽/шт.</span>
                                    <span className="font-medium">{(item.price * item.quantity).toLocaleString()} ₽</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отмена заказа</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Причина отмены</Label>
              <Textarea
                id="reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Укажите причину отмены заказа"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder}>
              Подтвердить отмену
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
