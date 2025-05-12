export interface OrderItem {
  product_id: number
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: number
  status: string
  created_at: string
  warehouse: number
  qr_code: string | null
  items: OrderItem[]
  total_price: number
  client_name: string
  destination_address: string
  comment?: string
  cancellation_reason: string | null
}

export interface OrderCreateInput {
  warehouse_id: number
  items: {
    product_id: number
    quantity: number
  }[]
  client_name: string
  destination_address: string
  comment?: string
}

export interface OrderStatusInput {
  status: string
  reason?: string
}

export interface ReturnItem {
  product_id: number
  name: string
  quantity: number
}

export interface Return {
  order_id: number
  reason?: string
  created_at: string
  items: ReturnItem[]
}

export interface ReturnInput {
  reason?: string
  items: {
    product_id: number
    quantity: number
  }[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export async function getOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/orders/order`)
  if (!response.ok) {
    throw new Error('Ошибка при получении заказов')
  }
  return response.json()
}

export async function getOrderById(id: number): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/order/${id}`)
  if (!response.ok) {
    throw new Error('Ошибка при получении заказа')
  }
  return response.json()
}

export async function createOrder(order: OrderCreateInput): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/order_create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(order),
  })
  if (!response.ok) {
    throw new Error('Ошибка при создании заказа')
  }
  return response.json()
}

export async function updateOrderStatus(id: number, status: OrderStatusInput): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/order/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(status),
  })
  if (!response.ok) {
    throw new Error('Ошибка при обновлении статуса заказа')
  }
  return response.json()
}

export async function cancelOrder(id: number, reason: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/order/${id}/cancel`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      status: 'cancelled',
      reason 
    }),
  })
  if (!response.ok) {
    throw new Error('Ошибка при отмене заказа')
  }
  return response.json()
}

export async function createReturn(orderId: number, returnData: ReturnInput): Promise<Return> {
  const response = await fetch(`${API_BASE_URL}/orders/order/${orderId}/return`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(returnData),
  })
  if (!response.ok) {
    throw new Error('Ошибка при создании возврата')
  }
  return response.json()
}

export async function updateOrder(id: number, order: Partial<Order>): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/order/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(order),
  })
  if (!response.ok) {
    throw new Error('Ошибка при обновлении заказа')
  }
  return response.json()
}

export async function deleteOrder(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/orders/${id}/`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Ошибка при удалении заказа')
  }
} 