"use client"

import { useEffect, useState } from "react"
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
import { toast } from "sonner"
import { createOrder } from "@/lib/api/orders"
import { getWarehouses } from "@/lib/api/warehouses"
import { getProducts, type Product as ApiProduct } from "@/lib/api/products"
import { API_BASE_URL } from "@/lib/constants"

interface Warehouse {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  price: number
  product_type: string
  product_description: string | null
}

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
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [orderData, setOrderData] = useState({
    warehouse_id: "",
    client_name: "",
    destination_address: "",
    comment: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [warehousesData, productsData] = await Promise.all([
          getWarehouses(),
          getProducts()
        ])
        setWarehouses(warehousesData)
        setProducts(productsData)
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error)
        toast.error("Не удалось загрузить данные")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

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
    if (!orderData.warehouse_id || !orderData.client_name || !orderData.destination_address || orderItems.length === 0) {
      toast.error("Пожалуйста, заполните все обязательные поля и добавьте товары в заказ")
      return
    }

    setIsLoading(true)

    try {
      const orderPayload = {
        warehouse_id: Number.parseInt(orderData.warehouse_id),
        client_name: orderData.client_name,
        destination_address: orderData.destination_address,
        comment: orderData.comment || undefined,
        items: orderItems.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
      }

      const response = await createOrder(orderPayload)
      toast.success("Заказ успешно создан")
      router.push(`/dashboard/orders/${response.id}`)
    } catch (error) {
      console.error("Ошибка при создании заказа:", error)
      toast.error("Произошла ошибка при создании заказа")
    } finally {
      setIsLoading(false)
    }
  }

  const totalCost = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0)

  if (isLoadingData) {
    return <div>Загрузка данных...</div>
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
                <Label htmlFor="warehouse">Склад</Label>
                <Select
                  value={orderData.warehouse_id}
                  onValueChange={(value) => setOrderData({ ...orderData, warehouse_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите склад" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_name">Имя клиента</Label>
                <Input
                  id="client_name"
                  value={orderData.client_name}
                  onChange={(e) => setOrderData({ ...orderData, client_name: e.target.value })}
                  placeholder="Введите имя клиента"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination_address">Адрес доставки</Label>
                <Input
                  id="destination_address"
                  value={orderData.destination_address}
                  onChange={(e) => setOrderData({ ...orderData, destination_address: e.target.value })}
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

              <Button 
                className="w-full" 
                onClick={handleCreateOrder}
                disabled={isLoading}
              >
                {isLoading ? "Создание заказа..." : "Создать заказ"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
