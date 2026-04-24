import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  import.meta.env.VITE_API_URL?.trim() ||
  'https://edu-management-backend-production.up.railway.app/api'

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
