"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getWarehouseById, updateWarehouse, getWarehouseProducts, getProductStock, type Warehouse, type WarehouseProduct } from "@/lib/api/warehouses"
import { toast } from "sonner"

interface WarehouseDetailClientProps {
  warehouseId: number
}

export default function WarehouseDetailClient({ warehouseId }: WarehouseDetailClientProps) {
  const router = useRouter()
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [products, setProducts] = useState<WarehouseProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productsError, setProductsError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        if (isNaN(warehouseId)) {
          setError("Неверный ID склада")
          return
        }
        console.log("Fetching warehouse with ID:", warehouseId)
        const data = await getWarehouseById(warehouseId)
        console.log("Received warehouse data:", data)
        setWarehouse(data)
      } catch (err) {
        console.error("Error fetching warehouse:", err)
        setError("Ошибка при загрузке информации о складе")
      }
    }

    const fetchProducts = async () => {
      try {
        if (isNaN(warehouseId)) {
          setProductsError("Неверный ID склада")
          return
        }
        console.log("Fetching products for warehouse:", warehouseId)
        const data = await getWarehouseProducts(warehouseId)
        console.log("Received products data:", data)
        
        if (!Array.isArray(data)) {
          console.error("Received data is not an array:", data)
          setProductsError("Неверный формат данных о товарах")
          return
        }

        const productsWithStock = await Promise.all(
          data.map(async (product) => {
            try {
              if (!product.id || !product.name || !product.product_type || typeof product.price !== 'number') {
                console.error("Invalid product data:", product)
                return null
              }

              let stockData
              try {
                stockData = await getProductStock(product.id, warehouseId)
              } catch (err) {
                console.error("Error fetching stock data for product:", product.id, err)
                stockData = { quantity: 0 }
              }
              
              return {
                id: product.id,
                name: product.name,
                product_type: product.product_type,
                product_description: product.product_description || "",
                price: product.price,
                warehouses_with_stock: product.warehouses_with_stock || [],
                quantity: stockData?.quantity ?? 0
              }
            } catch (err) {
              console.error("Error processing product:", product.id, err)
              return null
            }
          })
        )

        const validatedProducts = productsWithStock.filter((product): product is NonNullable<typeof product> => 
          product !== null && 
          typeof product.id === 'number' && 
          typeof product.name === 'string' &&
          typeof product.product_type === 'string' &&
          typeof product.price === 'number' &&
          typeof product.quantity === 'number'
        )
        
        setProducts(validatedProducts)
      } catch (err) {
        console.error("Error fetching products:", err)
        setProductsError("Ошибка при загрузке товаров")
      }
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      setProductsError(null)
      try {
        await Promise.all([fetchWarehouse(), fetchProducts()])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
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
                  <TableHead>ID</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Количество</TableHead>
                  <TableHead>Общая стоимость</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.product_type}</TableCell>
                    <TableCell>{product.price.toLocaleString('ru-RU')} ₽</TableCell>
                    <TableCell>{product.quantity || 0}</TableCell>
                    <TableCell>{(product.price * (product.quantity || 0)).toLocaleString('ru-RU')} ₽</TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      На складе нет товаров
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 