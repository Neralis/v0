import { Suspense } from "react"
import WarehouseDetailClient from "./WarehouseDetailClient"

export default function WarehouseDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <WarehouseDetailClient warehouseId={Number(params.id)} />
    </Suspense>
  )
}
