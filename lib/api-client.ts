// Заготовка для API-клиента Django Ninja

// Базовый URL API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// Функция для получения заголовков с токеном авторизации
const getAuthHeaders = () => {
  // В реальном приложении здесь будет логика получения токена из localStorage или cookies
  const token = localStorage.getItem("auth_token")
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  }
}

// Общая функция для выполнения запросов
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = {
      ...getAuthHeaders(),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Ошибка ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API error:", error)
    throw error
  }
}

// API для работы с товарами
export const productsApi = {
  // Получить список всех товаров
  getAll: () => fetchApi("/products/"),

  // Получить товар по ID
  getById: (id: number) => fetchApi(`/products/${id}/`),

  // Создать новый товар
  create: (data: any) =>
    fetchApi("/products/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Обновить товар
  update: (id: number, data: any) =>
    fetchApi(`/products/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Удалить товар
  delete: (id: number) =>
    fetchApi(`/products/${id}/`, {
      method: "DELETE",
    }),
}

// API для работы со складами
export const warehousesApi = {
  // Получить список всех складов
  getAll: () => fetchApi("/warehouses/"),

  // Получить склад по ID
  getById: (id: number) => fetchApi(`/warehouses/${id}/`),

  // Создать новый склад
  create: (data: any) =>
    fetchApi("/warehouses/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Обновить склад
  update: (id: number, data: any) =>
    fetchApi(`/warehouses/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Удалить склад
  delete: (id: number) =>
    fetchApi(`/warehouses/${id}/`, {
      method: "DELETE",
    }),

  // Получить товары на складе
  getProducts: (id: number) => fetchApi(`/warehouses/${id}/products/`),

  // Добавить товар на склад
  addProduct: (id: number, data: any) =>
    fetchApi(`/warehouses/${id}/products/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// API для работы с заказами
export const ordersApi = {
  // Получить список всех заказов
  getAll: () => fetchApi("/orders/"),

  // Получить заказ по ID
  getById: (id: number) => fetchApi(`/orders/${id}/`),

  // Создать новый заказ
  create: (data: any) =>
    fetchApi("/orders/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Обновить заказ
  update: (id: number, data: any) =>
    fetchApi(`/orders/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Обновить статус заказа
  updateStatus: (id: number, status: string) =>
    fetchApi(`/orders/${id}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Удалить заказ
  delete: (id: number) =>
    fetchApi(`/orders/${id}/`, {
      method: "DELETE",
    }),

  // Получить отчет по заказу
  getReport: (id: number) => fetchApi(`/orders/${id}/report/`),

  // Получить отчет по всем заказам
  getAllReport: () => fetchApi("/orders/report/"),
}

// API для работы с клиентами
export const customersApi = {
  // Получить список всех клиентов
  getAll: () => fetchApi("/customers/"),

  // Получить клиента по ID
  getById: (id: number) => fetchApi(`/customers/${id}/`),

  // Создать нового клиента
  create: (data: any) =>
    fetchApi("/customers/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Обновить клиента
  update: (id: number, data: any) =>
    fetchApi(`/customers/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Удалить клиента
  delete: (id: number) =>
    fetchApi(`/customers/${id}/`, {
      method: "DELETE",
    }),
}

// API для аутентификации
export const authApi = {
  // Вход в систему
  login: (username: string, password: string) =>
    fetchApi("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  // Выход из системы
  logout: () =>
    fetchApi("/auth/logout/", {
      method: "POST",
    }),

  // Получить информацию о текущем пользователе
  me: () => fetchApi("/auth/me/"),
}
