import axios from 'axios'

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const BASE_URL = isDev ? 'http://localhost:3000/api' : '/api'

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    const pairId = uni.getStorageSync('auth_pair_id')
    if (pairId) {
      config.headers['X-Pair-Id'] = pairId
    }

    const token = uni.getStorageSync('auth_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        uni.removeStorageSync('auth_token')
        uni.removeStorageSync('auth_user_id')
        uni.removeStorageSync('auth_pair_id')
        uni.redirectTo({ url: '/pages/login/index' })
      } else if (status === 403) {
        uni.showToast({ title: '无权访问', icon: 'none' })
      } else {
        const message = error.response.data?.message || '请求失败'
        uni.showToast({ title: message, icon: 'none' })
      }
    } else if (error.request) {
      uni.showToast({ title: '网络请求超时', icon: 'none' })
    } else {
      uni.showToast({ title: '请求配置错误', icon: 'none' })
    }
    return Promise.reject(error)
  }
)

export { request }
export default request
