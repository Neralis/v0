const DJANGO_API_URL = 'http://127.0.0.1:8000/api/auth';

/**
 * Получает CSRF токен от Django сервера
 */
export async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${DJANGO_API_URL}/csrf`, {
    credentials: 'include',
  });
  return response.headers.get('X-CSRFToken') || '';
}

/**
 * Выполняет вход пользователя
 * @param username - Логин пользователя
 * @param password - Пароль пользователя
 */
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  const csrfToken = await getCsrfToken();

  const response = await fetch(`${DJANGO_API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });

  return response.json();
}

/**
 * Выполняет выход пользователя
 */
export async function logout(): Promise<{ message: string }> {
  const csrfToken = await getCsrfToken();

  const response = await fetch(`${DJANGO_API_URL}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
  });

  return response.json();
}

/**
 * Получает информацию о текущем пользователе
 */
export async function getUserInfo(): Promise<{
  is_authenticated: boolean;
  id?: number;
  username?: string;
  email?: string;
  groups?: string[];
}> {
  const response = await fetch(`${DJANGO_API_URL}/user`, {
    credentials: 'include',
  });
  return response.json();
} 