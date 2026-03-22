export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : `http://${window.location.hostname}:8000/api`

export const WS_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('http', 'ws') + '/api'
  : `ws://${window.location.hostname}:8000/api`
