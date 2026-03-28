import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:7002`

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
})

// Interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bionexo-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor to handle 401 (redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bionexo-token')
      localStorage.removeItem('bionexo-user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  localStorage.setItem('bionexo-token', data.accessToken)
  localStorage.setItem('bionexo-user', JSON.stringify(data.user))
  return data
}

export function logout() {
  localStorage.removeItem('bionexo-token')
  localStorage.removeItem('bionexo-user')
  window.location.href = '/login'
}

export function getStoredUser() {
  const raw = localStorage.getItem('bionexo-user')
  return raw ? JSON.parse(raw) : null
}

export function isAuthenticated() {
  return !!localStorage.getItem('bionexo-token')
}
