const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export async function getOrdersReport(): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/report/orders_report`, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  })
  if (!response.ok) {
    throw new Error('Ошибка при получении отчета по заказам')
  }
  return response.blob()
}

export async function getStockReport(): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/report/stock_report`, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  })
  if (!response.ok) {
    throw new Error('Ошибка при получении отчета по складам')
  }
  return response.blob()
}

export async function getSingleOrderReport(orderId: number): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/report/order-report/${orderId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  })
  if (!response.ok) {
    throw new Error('Ошибка при получении отчета по заказу')
  }
  return response.blob()
} 