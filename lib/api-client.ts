// Заготовка для API-клиента Django Ninja

// Базовый URL API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

// Функция для получения заголовков
const getAuthHeaders = () => {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
  }
}



// Общая функция для выполнения запросов
export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    console.log("=== API Request ===")
    console.log("URL:", url)
    console.log("Method:", options.method || "GET")
    
    const headers = {
      ...getAuthHeaders(),
      ...options.headers,
    }
    
    console.log("Headers:", headers)

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      mode: "cors",
      cache: "no-store",
    })

    // Проверяем все заголовки ответа
    console.log("=== Response Headers ===")
    response.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`)
    })

    // Проверяем заголовки Set-Cookie
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      console.log("Set-Cookie header:", setCookieHeader)
      // Парсим и устанавливаем куки вручную
      const cookies = setCookieHeader.split(';')
      cookies.forEach(cookie => {
        const [name, value] = cookie.split('=')
        if (name && value) {
          document.cookie = `${name.trim()}=${value.trim()}; path=/; SameSite=Lax`
        }
      })
    }

    console.log("=== API Response ===")
    console.log("Status:", response.status)
    console.log("Status Text:", response.statusText)

    if (!response.ok) {
      let errorData: { message?: string; detail?: string } = {}
      try {
        const text = await response.text()
        console.log("Error response text:", text)
        if (text && text.trim()) {
          try {
            errorData = JSON.parse(text)
          } catch (parseError) {
            console.error("Error parsing JSON:", parseError)
            errorData = { message: text }
          }
        }
      } catch (e) {
        console.error("Error reading response:", e)
      }
      
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        url: url,
      })
      
      const errorMessage = 
        errorData.message || 
        errorData.detail || 
        `Ошибка ${response.status}: ${response.statusText} (${url})`
      
      throw new Error(errorMessage)
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      console.log("Response data:", data)
      return data
    } else {
      const text = await response.text()
      console.log("Response text:", text)
      return text
    }
  } catch (error) {
    console.error("API error:", error)
    throw error
  }
}

interface AuthResponse {
  success: boolean;
  message?: string;
  is_authenticated?: boolean;
  user?: {
    id: string;
    username: string;
    email?: string;
  };
}

// Add in api-client.ts
interface LoginResponse {
  success: boolean;
  message: string;
  is_authenticated?: boolean;
  // Add other possible fields
}

// API для аутентификации
export const authApi = {
  // Вход в систему
  login: async (username: string, password: string) => {
    try {
      const response = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }) as LoginResponse;
  
      if (response.success) {
        const userData = await fetchApi("/auth/user");
        return {
          ...userData,
          success: true
        };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Выход из системы
  logout: async () => {
    try {
      console.log("Cookies before logout:", document.cookie)

      const response = await fetchApi("/auth/logout", {
        method: "POST",
      })

      // Проверяем куки после выхода
      console.log("Cookies after logout:", document.cookie)

      // Принудительно очищаем все куки
      document.cookie.split(";").forEach((c) => {
        const cookie = c.trim()
        const name = cookie.split("=")[0]
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
      })

      return response
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  },

  // Получить информацию о текущем пользователе
  me: async () => {
    try {
      console.log("=== Checking Authentication ===")
      console.log("Current cookies:", document.cookie)
      console.log("Headers being sent:", getAuthHeaders())
      
      const response = await fetchApi("/auth/user")
      console.log("Raw response from /auth/user:", response)
      
      // Проверяем, что ответ не пустой
      if (!response || Object.keys(response).length === 0) {
        console.error("Empty response from /auth/user")
        throw new Error("Пустой ответ от сервера")
      }

      return {
        id: response.id,
        username: response.username,
        email: response.email,
        full_name: response.full_name || response.username,
        isAuthenticated: response.is_authenticated
      }
    } catch (error) {
      console.error("Get user info error:", error)
      throw error
    }
  },
}

// API для работы с товарами
export const productsApi = {
  // Получить список всех товаров
  getAll: () => fetchApi("/products/product_list_get"),

  // Получить товар по ID
  getById: (id: number) => fetchApi(`/products/product_detail_get?product_id=${id}`),

  // Создать новый товар
  create: (data: any) =>
    fetchApi("/products/product_create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Обновить товар
  update: (id: number, data: any) =>
    fetchApi(`/products/product_update/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Удалить товар
  delete: (id: number) =>
    fetchApi(`/products/product_delete`, {
      method: "DELETE",
      body: JSON.stringify({ product_id: id }),
    }),
}

// API для работы со складами
export const warehousesApi = {
  // Получить список всех складов
  getAll: () => fetchApi("/warehouses/warehouse_list"),

  // Получить склад по ID
  getById: (id: number) => fetchApi(`/warehouses/warehouse/${id}`),

  // Создать новый склад
  create: (data: any) =>
    fetchApi("/warehouses/warehouse_create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Обновить склад
  update: (id: number, data: any) =>
    fetchApi(`/warehouses/warehouse_update/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Удалить склад
  delete: (id: number) =>
    fetchApi(`/warehouses/warehouse_delete`, {
      method: "DELETE",
      body: JSON.stringify({ warehouse_id: id }),
    }),
}

// API для работы с заказами
export const ordersApi = {
  // Получить список всех заказов
  getAll: () => fetchApi("/orders/order"),

  // Получить заказ по ID
  getById: (id: number) => fetchApi(`/orders/order/${id}`),

  // Создать новый заказ
  create: (data: any) =>
    fetchApi("/orders/order_create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Обновить статус заказа
  updateStatus: (id: number, status: string) =>
    fetchApi(`/orders/order/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Отменить заказ
  cancel: (id: number) =>
    fetchApi(`/orders/order/${id}/cancel`, {
      method: "POST",
    }),

  // Получить отчет по заказу
  getReport: (id: number) => fetchApi(`/report/order-report/${id}`),

  // Получить отчет по всем заказам
  getAllReport: () => fetchApi("/report/orders_report"),
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
