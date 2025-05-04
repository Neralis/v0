"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createProduct } from "@/lib/api/products"
import { toast } from "sonner"

export default function CreateProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    product_type: "",
    price: "",
    product_description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createProduct({
        name: formData.name,
        product_type: formData.product_type,
        price: Number(formData.price),
        product_description: formData.product_description || undefined,
      })
      toast.success("Товар успешно создан")
      router.push("/dashboard/products")
    } catch (error) {
      console.error("Ошибка при создании товара:", error)
      toast.error("Произошла ошибка при создании товара")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Создание товара</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Информация о товаре</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Введите название товара"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_type">Тип товара</Label>
              <Input
                id="product_type"
                value={formData.product_type}
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                placeholder="Введите тип товара"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Цена</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Введите цену товара"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_description">Описание</Label>
              <Textarea
                id="product_description"
                value={formData.product_description}
                onChange={(e) => setFormData({ ...formData, product_description: e.target.value })}
                placeholder="Введите описание товара"
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