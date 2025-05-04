export interface Product {
  id: number;
  name: string;
  product_type: string;
  product_description: string | null;
  price: number;
  warehouses_with_stock: number[];
}

export interface ProductImage {
  id: number;
  product: number;
  image_url: string;
  alt_text: string;
  uploaded_at: string;
}

export interface ProductStock {
  product: string;
  total_quantity_all_warehouses?: number;
  quantity?: number;
  warehouses_with_stock: number[];
}

export interface ProductCreateInput {
  name: string;
  product_type: string;
  price: number;
  product_description?: string;
}

export interface ProductUpdateInput {
  name?: string;
  product_type?: string;
  price?: number;
  product_description?: string;
}

export interface ProductImageInput {
  product_id: number;
  alt_text?: string;
}

export interface StockOperationInput {
  product_id: number;
  warehouse_id: number;
  quantity: number;
}

export interface StockTransferInput {
  product_id: number;
  from_warehouse_id: number;
  to_warehouse_id: number;
  quantity: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

export async function getProducts(warehouseId?: number): Promise<Product[]> {
  const url = new URL(`${API_BASE_URL}/products/product_list_get`)
  if (warehouseId) {
    url.searchParams.append('warehouse_id', warehouseId.toString())
  }
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error('Ошибка при получении списка товаров')
  }
  return response.json()
}

export async function getProductById(id: number, warehouseId?: number): Promise<Product> {
  const url = new URL(`${API_BASE_URL}/products/product_detail_get`)
  url.searchParams.append('product_id', id.toString())
  if (warehouseId) {
    url.searchParams.append('warehouse_id', warehouseId.toString())
  }
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error('Ошибка при получении информации о товаре')
  }
  return response.json()
}

export async function createProduct(data: ProductCreateInput): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products/product_create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Ошибка при создании товара')
  }
  return response.json()
}

export async function updateProduct(id: number, data: ProductUpdateInput): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products/product_update/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Ошибка при обновлении товара')
  }
  return response.json()
}

export async function deleteProduct(id: number): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/products/product_delete?product_id=${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Ошибка при удалении товара')
  }
  return response.json()
}

export async function getProductStock(productId: number, warehouseId?: number): Promise<ProductStock> {
  const url = new URL(`${API_BASE_URL}/products/product_stock`)
  url.searchParams.append('product_id', productId.toString())
  if (warehouseId) {
    url.searchParams.append('warehouse_id', warehouseId.toString())
  }
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error('Ошибка при получении информации о наличии товара')
  }
  return response.json()
}

export async function addProductStock(data: StockOperationInput): Promise<{ status: string; stock_quantity: number }> {
  const response = await fetch(`${API_BASE_URL}/products/products/product_stock_add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Ошибка при добавлении товара на склад')
  }
  return response.json()
}

export async function decreaseProductStock(data: StockOperationInput): Promise<{ status: string; stock_quantity: number }> {
  const response = await fetch(`${API_BASE_URL}/products/products/product_stock_decrease`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Ошибка при списании товара со склада')
  }
  return response.json()
}

export async function transferProductStock(data: StockTransferInput): Promise<{
  status: string;
  message: string;
  from_warehouse_stock: number;
  to_warehouse_stock: number;
}> {
  const response = await fetch(`${API_BASE_URL}/products/products/product_stock_transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Ошибка при перемещении товара между складами')
  }
  return response.json()
}

export async function uploadProductImage(data: ProductImageInput, file: File): Promise<ProductImage> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('data', JSON.stringify(data))

  const response = await fetch(`${API_BASE_URL}/products/product/upload_image`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    throw new Error('Ошибка при загрузке изображения')
  }
  return response.json()
}

export async function getProductImages(productId: number): Promise<ProductImage[]> {
  const response = await fetch(`${API_BASE_URL}/products/product/images?product_id=${productId}`)
  if (!response.ok) {
    throw new Error('Ошибка при получении изображений товара')
  }
  return response.json()
} 