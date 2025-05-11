"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getWarehouseById, updateWarehouse, getWarehouseProducts, getProductStock, type Warehouse, type WarehouseProduct } from "@/lib/api/warehouses"
import { toast } from "sonner"
import { ArrowUpDown, Download, Plus, Package, Truck, Users, ArrowRightLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Product, getProducts, transferProductStock } from "@/lib/api/products"
import { Order, getOrders, createOrder as createOrderApi } from "@/lib/api/orders"
import { API_BASE_URL } from "@/lib/constants"

interface WarehouseDetailClientProps {
  warehouseId: number
}

export default function WarehouseDetailClient({ warehouseId }: WarehouseDetailClientProps) {
  const router = useRouter()
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [sortField, setSortField] = useState<keyof Product | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [transferQuantity, setTransferQuantity] = useState<number>(1)
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>("")
  const [createOrder, setCreateOrder] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [productStock, setProductStock] = useState<{ [key: number]: number }>({})

  // Добавляем расчет общей стоимости
  const totalValue = products.reduce((sum, product) => {
    const quantity = productStock[product.id] || 0
    return sum + (product.price * quantity)
  }, 0)

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedProducts = [...products].sort((a, b) => {
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

  const fetchProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data)
      
      // Получаем информацию о наличии для каждого товара
      const stockPromises = data.map(product => 
        getProductStock(product.id, warehouseId)
          .then(stock => ({ id: product.id, quantity: stock.quantity || 0 }))
          .catch(() => ({ id: product.id, quantity: 0 }))
      )
      const stockResults = await Promise.all(stockPromises)
      const stockMap = stockResults.reduce((acc, { id, quantity }) => {
        acc[id] = quantity
        return acc
      }, {} as { [key: number]: number })
      setProductStock(stockMap)
    } catch (err) {
      setProductsError("Ошибка при загрузке товаров")
      console.error(err)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getWarehouseById(warehouseId)
        setWarehouse(data)
        await fetchProducts()
      } catch (err) {
        setError("Ошибка при загрузке данных склада")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [warehouseId])

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/warehouses/warehouse_list`)
        if (!response.ok) {
          throw new Error('Ошибка при получении списка складов')
        }
        const text = await response.text()
        let data
        try {
          data = JSON.parse(text)
        } catch (e) {
          console.error('Ошибка парсинга JSON:', text)
          throw new Error('Неверный формат данных от сервера')
        }
        if (!Array.isArray(data)) {
          throw new Error('Полученные данные не являются массивом')
        }
        console.log('Полученные склады:', data) // Для отладки
        setWarehouses(data.filter((w: Warehouse) => w.id !== warehouseId))
      } catch (err) {
        console.error("Ошибка при загрузке списка складов:", err)
        toast.error("Не удалось загрузить список складов")
      }
    }
    fetchWarehouses()
  }, [warehouseId])

  const handleSave = async () => {
    if (!warehouse) return

    setIsSaving(true)
    try {
      await updateWarehouse(warehouse.id, {
        name: warehouse.name,
        address: warehouse.address || undefined,
      })
      toast.success("Склад успешно обновлен")
      setIsEditing(false)
    } catch (err) {
      toast.error("Ошибка при обновлении склада")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTransferClick = (product: Product) => {
    setSelectedProduct(product)
    setTransferQuantity(1)
    setTargetWarehouseId("")
    setCreateOrder(false)
    setIsTransferDialogOpen(true)
  }

  const handleTransfer = async () => {
    if (!selectedProduct || !targetWarehouseId || transferQuantity <= 0) {
      toast.error("Пожалуйста, заполните все поля корректно")
      return
    }

    try {
      // Сначала выполняем трансфер товара
      const result = await transferProductStock(
        selectedProduct.id,
        warehouseId,
        parseInt(targetWarehouseId),
        transferQuantity
      )

      if (result.status === "success") {
        // Если выбран чекбокс создания заказа, создаем заказ
        if (createOrder === true) {
          try {
            const orderData = {
              warehouse_id: parseInt(targetWarehouseId),
              items: [{
                product_id: selectedProduct.id,
                quantity: transferQuantity
              }]
            }
            
            const order = await createOrderApi(orderData)
            toast.success(`Заказ #${order.id} успешно создан`)
          } catch (orderError) {
            console.error("Ошибка при создании заказа:", orderError)
            toast.error("Товар перемещен, но не удалось создать заказ")
          }
        }

        toast.success(result.message)
        setIsTransferDialogOpen(false)
        fetchProducts() // Обновляем список товаров
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Ошибка при перемещении товара:", error)
      toast.error("Произошла ошибка при перемещении товара")
    }
  }

  if (isLoading) {
    return <div>Загрузка...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!warehouse) {
    return <div className="text-red-500">Склад не найден</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? "Редактирование склада" : "Информация о складе"}
        </h1>
        <div className="flex gap-2">
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>Редактировать</Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Сохранение..." : "Сохранить"}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            {isEditing ? (
              <Input
                id="name"
                value={warehouse.name}
                onChange={(e) => setWarehouse({ ...warehouse, name: e.target.value })}
              />
            ) : (
              <div className="text-lg">{warehouse.name}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Адрес</Label>
            {isEditing ? (
              <Textarea
                id="address"
                value={warehouse.address || ""}
                onChange={(e) => setWarehouse({ ...warehouse, address: e.target.value })}
                placeholder="Введите адрес склада"
              />
            ) : (
              <div className="text-lg">{warehouse.address || "Адрес не указан"}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Общая стоимость товаров</Label>
            <div className="text-lg font-semibold">{totalValue.toLocaleString('ru-RU')} ₽</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Товары на складе</CardTitle>
        </CardHeader>
        <CardContent>
          {productsError ? (
            <div className="text-red-500">{productsError}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("id")}>
                      ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("name")}>
                      Название
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("product_type")}>
                      Тип
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("price")}>
                      Цена
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Количество</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">#{product.id}</TableCell>
                    <TableCell>
                      <Link 
                        href={`/dashboard/products/${product.id}`}
                        className="text-primary hover:underline"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell>{product.product_type}</TableCell>
                    <TableCell>{product.price} ₽</TableCell>
                    <TableCell>{product.product_description || "-"}</TableCell>
                    <TableCell>{productStock[product.id] || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/products/${product.id}`}>
                          <Button variant="outline" size="sm">
                            Подробнее
                          </Button>
                        </Link>
                        {productStock[product.id] > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTransferClick(product)}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Переместить
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      На складе нет товаров
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Перемещение товара</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Товар</Label>
                <div className="text-sm">
                  {selectedProduct.name} (ID: {selectedProduct.id})
                </div>
              </div>
              <div className="space-y-2">
                <Label>Количество</Label>
                <Input
                  type="number"
                  min="1"
                  max={productStock[selectedProduct.id] || 0}
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 0)}
                />
                <div className="text-sm text-muted-foreground">
                  Доступно: {productStock[selectedProduct.id] || 0} шт.
                </div>
              </div>
              <div className="space-y-2">
                <Label>Склад назначения</Label>
                <Select value={targetWarehouseId} onValueChange={setTargetWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите склад" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        #{warehouse.id} "{warehouse.name}"
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createOrder"
                  checked={createOrder}
                  onCheckedChange={(checked) => setCreateOrder(checked as boolean)}
                />
                <Label htmlFor="createOrder">Создать заказ на перемещение</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleTransfer}>
              Переместить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 