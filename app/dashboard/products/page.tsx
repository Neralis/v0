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
import { Product, getProducts, deleteProduct, getProductStock } from "@/lib/api/products"
import { toast } from "sonner"

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [sortField, setSortField] = useState<keyof Product | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productStock, setProductStock] = useState<{ [key: number]: number }>({})

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts()
        setProducts(data)
        // Получаем информацию о наличии для каждого товара
        const stockPromises = data.map(product => 
          getProductStock(product.id)
            .then(stock => ({ id: product.id, quantity: stock.total_quantity_all_warehouses || 0 }))
            .catch(() => ({ id: product.id, quantity: 0 }))
        )
        const stockResults = await Promise.all(stockPromises)
        const stockMap = stockResults.reduce((acc, { id, quantity }) => {
          acc[id] = quantity
          return acc
        }, {} as { [key: number]: number })
        setProductStock(stockMap)
      } catch (err) {
        setError("Ошибка при загрузке товаров")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

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

  const handleDownloadReport = async () => {
    try {
      // Здесь можно добавить вызов API для получения отчета
      alert("Отчет по всем товарам будет скачан")
    } catch (error) {
      console.error("Ошибка при скачивании отчета:", error)
      alert("Произошла ошибка при скачивании отчета")
    }
  }

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return

    try {
      const result = await deleteProduct(selectedProduct.id)
      if (result.status === "success") {
        setProducts(products.filter(p => p.id !== selectedProduct.id))
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Ошибка при удалении товара:", error)
      toast.error("Произошла ошибка при удалении товара")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedProduct(null)
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
        <h1 className="text-3xl font-bold tracking-tight">Товары</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Скачать отчет
          </Button>
          <Button onClick={() => router.push("/dashboard/products/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить товар
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список товаров</CardTitle>
        </CardHeader>
        <CardContent>
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
                <TableHead>Склады с наличием</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">#{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.product_type}</TableCell>
                  <TableCell>{product.price} ₽</TableCell>
                  <TableCell>{product.product_description || "-"}</TableCell>
                  <TableCell>
                    {product.warehouses_with_stock.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.warehouses_with_stock.map(warehouseId => (
                          <Badge key={warehouseId} variant="outline">
                            Склад #{warehouseId}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="destructive">Нет в наличии</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/products/${product.id}`}>
                        <Button variant="outline" size="sm">
                          Подробнее
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteClick(product)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления товара</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <p>Вы уверены, что хотите удалить товар "{selectedProduct.name}"?</p>
              {productStock[selectedProduct.id] > 0 && (
                <div className="text-yellow-600">
                  <p>Внимание! На складах осталось {productStock[selectedProduct.id]} единиц этого товара.</p>
                  <p>Склады с наличием: {selectedProduct.warehouses_with_stock.map(id => `#${id}`).join(", ")}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false)
              setSelectedProduct(null)
            }}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
