"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Product, getProductById, updateProduct, getProductImages, uploadProductImage } from "@/lib/api/products"
import { toast } from "sonner"
import Image from "next/image"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = Number(params.id)

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<any[]>([])
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(productId)
        setProduct(data)
        const productImages = await getProductImages(productId)
        setImages(productImages)
      } catch (err) {
        setError("Ошибка при загрузке информации о товаре")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  const handleSave = async () => {
    if (!product) return

    setIsSaving(true)
    try {
      const updatedProduct = await updateProduct(productId, {
        name: product.name,
        product_type: product.product_type,
        price: product.price,
        product_description: product.product_description,
      })
      setProduct(updatedProduct)
      setIsEditing(false)
      toast.success("Товар успешно обновлен")
    } catch (error) {
      console.error("Ошибка при обновлении товара:", error)
      toast.error("Произошла ошибка при обновлении товара")
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async () => {
    if (!selectedImage || !product) return

    try {
      const formData = new FormData()
      formData.append('file', selectedImage)
      formData.append('data', JSON.stringify({ product_id: product.id }))

      const response = await uploadProductImage({ product_id: product.id }, selectedImage)
      setImages([...images, response])
      setSelectedImage(null)
      toast.success("Изображение успешно загружено")
    } catch (error) {
      console.error("Ошибка при загрузке изображения:", error)
      toast.error("Произошла ошибка при загрузке изображения")
    }
  }

  if (isLoading) {
    return <div>Загрузка...</div>
  }

  if (error || !product) {
    return <div className="text-red-500">{error || "Товар не найден"}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Товар #{product.id}</h1>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Редактировать
        </Button>
          ) : (
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
            {isEditing ? (
                <Input
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                />
              ) : (
                <div className="text-lg font-medium">{product.name}</div>
              )}
              </div>

            <div className="space-y-2">
              <Label>Тип товара</Label>
              {isEditing ? (
                <Input
                  value={product.product_type}
                  onChange={(e) => setProduct({ ...product, product_type: e.target.value })}
                />
              ) : (
                <Badge variant="outline">{product.product_type}</Badge>
            )}
          </div>

            <div className="space-y-2">
              <Label>Цена</Label>
          {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.price}
                  onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
                />
              ) : (
                <div className="text-lg font-medium">{product.price} ₽</div>
        )}
      </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              {isEditing ? (
                <Textarea
                  value={product.product_description || ""}
                  onChange={(e) => setProduct({ ...product, product_description: e.target.value })}
                />
              ) : (
                <div className="text-muted-foreground">
                  {product.product_description || "Описание отсутствует"}
                </div>
              )}
            </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
            <CardTitle>Изображения</CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative aspect-square">
                  <Image
                    src={image.image_url}
                    alt={image.alt_text || `Изображение товара ${product.name}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Загрузить новое изображение</Label>
              <div className="flex gap-2">
                        <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                />
                <Button
                  onClick={handleImageUpload}
                  disabled={!selectedImage}
                >
                  Загрузить
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>

          <Card>
            <CardHeader>
              <CardTitle>Наличие на складах</CardTitle>
            </CardHeader>
            <CardContent>
          {product.warehouses_with_stock.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {product.warehouses_with_stock.map((warehouseId) => (
                <Badge key={warehouseId} variant="outline">
                  Склад #{warehouseId}
                </Badge>
                ))}
              </div>
          ) : (
            <div className="text-muted-foreground">Товар отсутствует на складах</div>
          )}
            </CardContent>
          </Card>
    </div>
  )
}
