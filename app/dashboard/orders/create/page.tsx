"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

// Моковые данные для клиентов
const customers = [
  { id: 1, name: "Иванов Иван", email: "ivanov@example.com", phone: "+7 (999) 123-45-67" },
  { id: 2, name: "Петров Петр", email: "petrov@example.com", phone: "+7 (999) 234-56-78" },
  { id: 3, name: "Сидорова Анна", email: "sidorova@example.com", phone: "+7 (999) 345-67-89" },
  { id: 4, name: "Козлов Дмитрий", email: "kozlov@example.com", phone: "+7 (999) 456-78-90" },
  { id: 5, name: "Смирнова Елена", email: "smirnova@example.com", phone: "+7 (999) 567-89-01" },
]

// Моковые данные для товаров
const products = [
  { id: 1, name: "Смартфон XYZ", price: 15000, type: "Электроника" },
  { id: 2, name: "Ноутбук ABC", price: 45000, type: "Электроника" },
  { id: 3, name: "Планшет 123", price: 20000, type: "Электроника" },
  { id: 4, name: "Наушники QWE", price: 5000, type: "Аксессуары" },
  { id: 5, name: "Телевизор UHD", price: 35000, type: "Электроника" },
  { id: 6, name: "Колонка BT", price: 3000, type: "Аксессуары" },
]

// Статусы заказов
const orderStatuses = ["В обработке", "Подтвержден", "Отправлен", "Доставлен", "Отменен"]

interface OrderItem {
  id: string
  productId: number
  productName: string
  quantity: number
  price: number
}

export default function CreateOrderPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [orderData, setOrderData] = useState({
    customerId: "",
    status: "В обработке",
    address: "",
    comment: "",
  })

  const handleAddItem = () => {
    if (selectedProduct && Number.parseInt(quantity) > 0) {
      const productId = Number.parseInt(selectedProduct)
      const product = products.find((p) => p.id === productId)

      if (product) {
        const newItem: OrderItem = {
          id: Date.now().toString(),
          productId: product.id,
          productName: product.name,
          quantity: Number.parseInt(quantity),
          price: product.price,
        }

        setOrderItems([...orderItems, newItem])
        setSelectedProduct("")
        setQuantity("1")
      }
    }
  }

  const handleRemoveItem = (id: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== id))
  }

  const handleCreateOrder = async () => {
    if (!orderData.customerId || orderItems.length === 0) {
      alert("Пожалуйста, выберите клиента и добавьте товары в заказ")
      return
    }

    setIsLoading(true)

    try {
      // Подготовка данных для API
      const orderPayload = {
        customer_id: Number.parseInt(orderData.customerId),
        status: orderData.status,
        address: orderData.address,
        comment: orderData.comment,
        items: orderItems.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      }

      // В реальном приложении здесь был бы вызов API
      console.log("Отправка данных на сервер:", orderPayload)

      // Имитация вызова API
      // const response = await ordersApi.create(orderPayload)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Перенаправление на страницу заказов
      router.push("/dashboard/orders")
    } catch (error) {
      console.error("Ошибка при создании заказа:", error)
      alert("Произошла ошибка при создании заказа")
    } finally {
      setIsLoading(false)
    }
  }

  const totalCost = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0)

  const getCustomerById = (id: string) => {
    return customers.find((c) => c.id === Number.parseInt(id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Назад</span>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Создание нового заказа</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Товары в заказе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="product">Товар</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите товар" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - {product.price.toLocaleString()} ₽
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-32">
                  <Label htmlFor="quantity">Количество</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить
                  </Button>
                </div>
              </div>

              {orderItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Количество</TableHead>
                      <TableHead>Цена</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <Button
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => router.push(`/dashboard/products/${item.productId}`)}
                          >
                            {item.productName}
                          </Button>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.price.toLocaleString()} ₽</TableCell>
                        <TableCell>{(item.quantity * item.price).toLocaleString()} ₽</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Добавьте товары в заказ</div>
              )}

              {orderItems.length > 0 && (
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-muted-foreground">Итого:</span>
                      <span className="text-xl font-bold">{totalCost.toLocaleString()} ₽</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация о заказе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Клиент</Label>
                <Select
                  value={orderData.customerId}
                  onValueChange={(value) => setOrderData({ ...orderData, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите клиента" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {orderData.customerId && (
                <div className="pt-2">
                  <div className="text-sm text-muted-foreground">{getCustomerById(orderData.customerId)?.email}</div>
                  <div className="text-sm text-muted-foreground">{getCustomerById(orderData.customerId)?.phone}</div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="status">Статус заказа</Label>
                <Select
                  value={orderData.status}
                  onValueChange={(value) => setOrderData({ ...orderData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Адрес доставки</Label>
                <Textarea
                  id="address"
                  value={orderData.address}
                  onChange={(e) => setOrderData({ ...orderData, address: e.target.value })}
                  placeholder="Введите адрес доставки"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Комментарий</Label>
                <Textarea
                  id="comment"
                  value={orderData.comment}
                  onChange={(e) => setOrderData({ ...orderData, comment: e.target.value })}
                  placeholder="Введите комментарий к заказу"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleCreateOrder}
            disabled={isLoading || orderItems.length === 0 || !orderData.customerId}
          >
            {isLoading ? "Создание..." : "Создать заказ"}
          </Button>
        </div>
      </div>
    </div>
  )
}
