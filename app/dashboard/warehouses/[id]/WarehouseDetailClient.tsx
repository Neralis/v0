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
import { ArrowUpDown, Download, Plus, Package, Truck, Users, ArrowRightLeft, PieChart, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Product, getProducts, transferProductStock } from "@/lib/api/products"
import { Order, getOrders, createOrder as createOrderApi } from "@/lib/api/orders"
import { API_BASE_URL } from "@/lib/constants"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { updateProductStock } from "@/lib/api/warehouses"
import { getStockReport } from "@/lib/api/reports"

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
  const [isEditQuantityDialogOpen, setIsEditQuantityDialogOpen] = useState(false)
  const [editQuantity, setEditQuantity] = useState<number>(0)
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false)
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)

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
      // Проверяем, что количество не превышает доступное
      const currentStock = productStock[selectedProduct.id] || 0
      if (transferQuantity > currentStock) {
        toast.error(`Недостаточно товара на складе. Доступно: ${currentStock} шт.`)
        return
      }

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
            // Добавляем небольшую задержку, чтобы дать время на обновление базы данных
            await new Promise(resolve => setTimeout(resolve, 1000))

            const orderData = {
              warehouse_id: parseInt(targetWarehouseId),
              items: [{
                product_id: selectedProduct.id,
                quantity: transferQuantity
              }],
              client_name: "Системный заказ",
              destination_address: "Перемещение между складами",
              comment: `Заказ создан автоматически при перемещении товара со склада #${warehouseId}`
            }
            
            const order = await createOrderApi(orderData)
            toast.success(`Заказ #${order.id} успешно создан`)
          } catch (orderError: any) {
            console.error("Ошибка при создании заказа:", orderError)
            // Проверяем конкретные ошибки при создании заказа
            if (orderError.message.includes('не найден на выбранном складе')) {
              toast.error("Товар перемещен, но не удалось создать заказ: товар не найден на складе назначения")
            } else if (orderError.message.includes('недостаточно товара')) {
              toast.error("Товар перемещен, но не удалось создать заказ: недостаточно товара на складе назначения")
            } else {
              toast.error(`Товар перемещен, но не удалось создать заказ: ${orderError.message}`)
            }
          }
        }

        toast.success(result.message)
        setIsTransferDialogOpen(false)
        fetchProducts() // Обновляем список товаров
      } else {
        // Обработка различных ошибок от API
        if (result.message.includes('недостаточно товара')) {
          toast.error(`Недостаточно товара на складе. Доступно: ${currentStock} шт.`)
        } else if (result.message.includes('не найден')) {
          toast.error("Товар не найден на складе")
        } else if (result.message.includes('склад не найден')) {
          toast.error("Склад назначения не найден")
        } else {
          toast.error(result.message || "Произошла ошибка при перемещении товара")
        }
      }
    } catch (error: any) {
      console.error("Ошибка при перемещении товара:", error)
      // Обработка сетевых ошибок и других исключений
      if (error.message.includes('Failed to fetch')) {
        toast.error("Ошибка соединения с сервером")
      } else if (error.message.includes('JSON')) {
        toast.error("Ошибка обработки данных от сервера")
      } else {
        toast.error(error.message || "Произошла ошибка при перемещении товара")
      }
    }
  }

  // Добавляем расчет данных для диаграммы
  const getChartData = (type: 'product_type' | 'name') => {
    const data = sortedProducts
      .filter(product => (productStock[product.id] || 0) > 0)
      .reduce((acc, product) => {
        const key = type === 'product_type' ? product.product_type : product.name
        const quantity = productStock[product.id] || 0
        
        const existingItem = acc.find(item => item.name === key)
        if (existingItem) {
          existingItem.value += quantity
        } else {
          acc.push({ name: key, value: quantity })
        }
        return acc
      }, [] as { name: string; value: number }[])

    return data
  }

  const COLORS = [
    '#0EA5E9', // sky-500
    '#10B981', // emerald-500
    '#6366F1', // indigo-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#F59E0B', // amber-500
    '#14B8A6', // teal-500
    '#84CC16', // lime-500
    '#EF4444', // red-500
    '#A855F7', // purple-500
  ]

  // Функция для получения цвета с учетом индекса
  const getColor = (index: number) => {
    const baseColor = COLORS[index % COLORS.length]
    const cycle = Math.floor(index / COLORS.length)
    
    if (cycle === 0) return baseColor

    // Преобразуем HEX в RGB
    const r = parseInt(baseColor.slice(1, 3), 16)
    const g = parseInt(baseColor.slice(3, 5), 16)
    const b = parseInt(baseColor.slice(5, 7), 16)

    // Уменьшаем яркость для каждого цикла
    const darkenFactor = 0.85 ** cycle
    const newR = Math.round(r * darkenFactor)
    const newG = Math.round(g * darkenFactor)
    const newB = Math.round(b * darkenFactor)

    // Преобразуем обратно в HEX
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
  }

  const handleEditQuantityClick = (product: Product) => {
    setSelectedProduct(product)
    setEditQuantity(productStock[product.id] || 0)
    setIsEditQuantityDialogOpen(true)
  }

  const handleUpdateQuantity = async () => {
    if (!selectedProduct || editQuantity < 0) {
      toast.error("Пожалуйста, введите корректное количество")
      return
    }

    setIsUpdatingQuantity(true)
    try {
      const result = await updateProductStock(
        selectedProduct.id,
        warehouseId,
        editQuantity
      )

      if (result.status === "success") {
        toast.success(result.message)
        setIsEditQuantityDialogOpen(false)
        // Обновляем локальное состояние
        setProductStock(prev => ({
          ...prev,
          [selectedProduct.id]: editQuantity
        }))
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Ошибка при обновлении количества:", error)
      toast.error("Произошла ошибка при обновлении количества")
    } finally {
      setIsUpdatingQuantity(false)
    }
  }

  const handleDownloadReport = async () => {
    setIsDownloadingReport(true)
    try {
      const blob = await getStockReport()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stock_report_${new Date().toISOString().split('T')[0]}.xlsx`
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
            <>
              <Button 
                variant="outline" 
                onClick={handleDownloadReport}
                disabled={isDownloadingReport}
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloadingReport ? "Скачивание..." : "Скачать отчет"}
              </Button>
              <Button onClick={() => setIsEditing(true)}>Редактировать</Button>
            </>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
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
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Финансовая информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label className="text-muted-foreground">Общая стоимость товаров</Label>
                <div className="text-2xl font-bold text-primary">
                  {totalValue.toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <Label className="text-muted-foreground">Количество товаров</Label>
                <div className="text-lg">
                  {Object.values(productStock).filter(quantity => quantity > 0).length} наименований
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Распределение товаров</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="product_type" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="product_type">По типам</TabsTrigger>
                <TabsTrigger value="name">По товарам</TabsTrigger>
              </TabsList>
              <TabsContent value="product_type" className="mt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={getChartData('product_type')}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getChartData('product_type').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} шт.`, 'Количество']}
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          padding: '8px'
                        }}
                      />
                      <Legend 
                        layout="vertical" 
                        align="right"
                        verticalAlign="middle"
                        wrapperStyle={{
                          paddingLeft: '20px'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="name" className="mt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={getChartData('name')}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getChartData('name').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} шт.`, 'Количество']}
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          padding: '8px'
                        }}
                      />
                      <Legend 
                        layout="vertical" 
                        align="right"
                        verticalAlign="middle"
                        wrapperStyle={{
                          paddingLeft: '20px'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

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
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts
                  .filter(product => (productStock[product.id] || 0) > 0)
                  .map((product) => (
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {productStock[product.id] || 0}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditQuantityClick(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
                {sortedProducts.filter(product => (productStock[product.id] || 0) > 0).length === 0 && (
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

      <Dialog open={isEditQuantityDialogOpen} onOpenChange={setIsEditQuantityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирование количества товара</DialogTitle>
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
                  min="0"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditQuantityDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateQuantity} disabled={isUpdatingQuantity}>
              {isUpdatingQuantity ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 