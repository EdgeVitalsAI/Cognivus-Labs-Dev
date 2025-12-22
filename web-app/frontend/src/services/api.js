import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_role')
      window.location.href = '/doctor/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  loginDoctor: async (credentials) => {
    const response = await api.post('/api/auth/doctor/login', credentials)
    return response.data
  },

  loginStaff: async (credentials) => {
    const response = await api.post('/api/auth/staff/login', credentials)
    return response.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_data')
  },

  getCurrentUser: () => {
    const userData = localStorage.getItem('user_data')
    return userData ? JSON.parse(userData) : null
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token')
  },

  getUserRole: () => {
    return localStorage.getItem('user_role')
  },
}

export default api
