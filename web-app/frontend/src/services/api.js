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
    // TEMPORARY: Mock authentication with hardcoded credentials
    // Username: admin, Password: admin123
    if (credentials.email === 'admin' && credentials.password === 'admin123') {
      const mockResponse = {
        access_token: 'mock-doctor-token-' + Date.now(),
        user: {
          full_name: 'Dr. Admin',
          email: 'admin@cognivuslabs.com',
          role: 'doctor'
        }
      }
      return mockResponse
    }
    throw new Error('Invalid credentials. Use admin/admin123')
  },

  loginStaff: async (credentials) => {
    // TEMPORARY: Mock authentication with hardcoded credentials
    // Username: admin, Password: admin123
    if (credentials.email === 'admin' && credentials.password === 'admin123') {
      const mockResponse = {
        access_token: 'mock-staff-token-' + Date.now(),
        user: {
          full_name: 'Admin Staff',
          email: 'admin@cognivuslabs.com',
          role: 'staff'
        }
      }
      return mockResponse
    }
    throw new Error('Invalid credentials. Use admin/admin123')
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
