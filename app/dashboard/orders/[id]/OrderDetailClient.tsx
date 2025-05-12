"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { getSingleOrderReport } from "@/lib/api/reports"
import { updateOrder } from "@/lib/api/orders"

interface OrderDetailClientProps {
  orderId: number
}

export default function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Здесь должна быть логика сохранения изменений заказа
      toast.success("Заказ успешно обновлен")
      setIsEditing(false)
    } catch (error) {
      console.error("Ошибка при обновлении заказа:", error)
      toast.error("Не удалось обновить заказ")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadReport = async () => {
    setIsDownloadingReport(true)
    try {
      const blob = await getSingleOrderReport(orderId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `order_report_${orderId}_${new Date().toISOString().split('T')[0]}.xlsx`
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? "Редактирование заказа" : "Информация о заказе"}
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
      // ... rest of the code ...
    </div>
  )
} 