import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

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
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        authService.logout()
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refresh_token: refreshToken
        })

        const { access_token, refresh_token: new_refresh_token, user } = response.data

        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', new_refresh_token)
        localStorage.setItem('user_data', JSON.stringify(user))
        localStorage.setItem('user_role', user.role)

        api.defaults.headers.common.Authorization = `Bearer ${access_token}`
        originalRequest.headers.Authorization = `Bearer ${access_token}`

        processQueue(null, access_token)

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        authService.logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export const authService = {
  loginDoctor: async (credentials) => {
    try {
      console.log('Attempting doctor login with:', { email: credentials.email })
      const response = await api.post('/api/auth/doctor/login', credentials)
      console.log('Doctor login response:', response.data)

      const { access_token, refresh_token, user } = response.data

      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user_data', JSON.stringify(user))
      localStorage.setItem('user_role', user.role)

      console.log('Tokens stored successfully. Role:', user.role)

      return response.data
    } catch (error) {
      console.error('Doctor login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })

      const errorMessage = error.response?.data?.detail || error.message || 'Login failed. Please try again.'
      throw new Error(errorMessage)
    }
  },

  loginStaff: async (credentials) => {
    try {
      console.log('Attempting staff login with:', { email: credentials.email })
      const response = await api.post('/api/auth/staff/login', credentials)
      console.log('Staff login response:', response.data)

      const { access_token, refresh_token, user } = response.data

      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user_data', JSON.stringify(user))
      localStorage.setItem('user_role', user.role)

      console.log('Tokens stored successfully. Role:', user.role)

      return response.data
    } catch (error) {
      console.error('Staff login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })

      const errorMessage = error.response?.data?.detail || error.message || 'Login failed. Please try again.'
      throw new Error(errorMessage)
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_data')

    const currentPath = window.location.pathname
    if (currentPath.includes('/staff')) {
      window.location.href = '/staff/login'
    } else {
      window.location.href = '/doctor/login'
    }
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

  verifyToken: async () => {
    try {
      const response = await api.get('/api/auth/verify')
      return response.data
    } catch (error) {
      return null
    }
  },
}

export default api
