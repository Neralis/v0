"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createWarehouse } from "@/lib/api/warehouses"
import { toast } from "sonner"

export default function CreateWarehousePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createWarehouse(formData)
      toast.success("Склад успешно создан")
      router.push("/dashboard/warehouses")
    } catch (error) {
      console.error("Ошибка при создании склада:", error)
      toast.error("Произошла ошибка при создании склада")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Создание склада</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Информация о складе</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Введите название склада"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Адрес</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Введите адрес склада"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Создание..." : "Создать"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 