export interface Warehouse {
  id: number;
  name: string;
  address: string | null;
}

export interface WarehouseProduct {
  id: number;
  name: string;
  product_type: string;
  product_description: string;
  price: number;
  warehouses_with_stock: number[];
  quantity?: number;
}

export interface WarehouseCreateInput {
  name: string;
  address?: string;
}

export interface WarehouseUpdateInput {
  name?: string;
  address?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export async function getWarehouses(): Promise<Warehouse[]> {
  const response = await fetch(`${API_BASE_URL}/warehouses/warehouse_list`)
  if (!response.ok) {
    throw new Error('Ошибка при получении списка складов')
  }
  return response.json()
}

export async function getWarehouseById(id: number): Promise<Warehouse> {
  const response = await fetch(`${API_BASE_URL}/warehouses/warehouse/${id}`)
  if (!response.ok) {
    throw new Error('Ошибка при получении информации о складе')
  }
  return response.json()
}

export async function getWarehouseProducts(warehouseId: number): Promise<WarehouseProduct[]> {
  try {
    console.log("Fetching products from URL:", `${API_BASE_URL}/products/product_list_get?warehouse_id=${warehouseId}`)
    const response = await fetch(`${API_BASE_URL}/products/product_list_get?warehouse_id=${warehouseId}`)
    if (!response.ok) {
      throw new Error('Ошибка при получении списка товаров на складе')
    }
    const data = await response.json()
    console.log("Received products data:", data)
    return data
  } catch (error) {
    console.error("Error in getWarehouseProducts:", error)
    throw error
  }
}

export async function createWarehouse(data: WarehouseCreateInput): Promise<Warehouse> {
  const response = await fetch(`${API_BASE_URL}/warehouses/warehouse_create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Ошибка при создании склада')
  }
  return response.json()
}

export async function updateWarehouse(id: number, data: WarehouseUpdateInput): Promise<Warehouse> {
  const response = await fetch(`${API_BASE_URL}/warehouses/warehouse_update/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Ошибка при обновлении склада')
  }
  return response.json()
}

export async function deleteWarehouse(id: number): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/warehouses/warehouse_delete?warehouse_id=${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Ошибка при удалении склада')
  }
  return response.json()
}

export async function getProductStock(productId: number, warehouseId: number): Promise<{ quantity: number }> {
  try {
    console.log("Fetching product stock from URL:", `${API_BASE_URL}/products/product_stock?product_id=${productId}&warehouse_id=${warehouseId}`)
    const response = await fetch(`${API_BASE_URL}/products/product_stock?product_id=${productId}&warehouse_id=${warehouseId}`)
    if (!response.ok) {
      throw new Error('Ошибка при получении количества товара')
    }
    const data = await response.json()
    console.log("Received stock data:", data)
    return { quantity: data.quantity || 0 }
  } catch (error) {
    console.error("Error in getProductStock:", error)
    return { quantity: 0 }
  }
} 