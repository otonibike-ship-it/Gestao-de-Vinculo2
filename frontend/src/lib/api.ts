import axios from 'axios'

const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || '') + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Injeta o token em todas as requisições
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redireciona para login em 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
