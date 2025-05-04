"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Warehouse, getWarehouses, deleteWarehouse } from "@/lib/api/warehouses"
import { toast } from "sonner"

export default function WarehousesPage() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [sortField, setSortField] = useState<keyof Warehouse | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getWarehouses()
        setWarehouses(data)
      } catch (err) {
        setError("Ошибка при загрузке складов")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWarehouses()
  }, [])

  const handleSort = (field: keyof Warehouse) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedWarehouses = [...warehouses].sort((a, b) => {
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

  const handleDeleteClick = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteWarehouse = async () => {
    if (!selectedWarehouse) return

    try {
      const result = await deleteWarehouse(selectedWarehouse.id)
      if (result.status === "success") {
        setWarehouses(warehouses.filter(w => w.id !== selectedWarehouse.id))
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Ошибка при удалении склада:", error)
      toast.error("Произошла ошибка при удалении склада")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedWarehouse(null)
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
        <h1 className="text-3xl font-bold tracking-tight">Склады</h1>
        <Button onClick={() => router.push("/dashboard/warehouses/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить склад
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список складов</CardTitle>
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
                <TableHead>Адрес</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedWarehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">#{warehouse.id}</TableCell>
                  <TableCell>{warehouse.name}</TableCell>
                  <TableCell>{warehouse.address || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/warehouses/${warehouse.id}`}>
                        <Button variant="outline" size="sm">
                          Подробнее
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteClick(warehouse)}
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
            <DialogTitle>Подтверждение удаления склада</DialogTitle>
          </DialogHeader>
          {selectedWarehouse && (
            <div className="space-y-4">
              <p>Вы уверены, что хотите удалить склад "{selectedWarehouse.name}"?</p>
              <p className="text-yellow-600">
                Внимание! Удаление склада может повлиять на учет товаров. Убедитесь, что на складе нет товаров.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false)
              setSelectedWarehouse(null)
            }}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteWarehouse}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
