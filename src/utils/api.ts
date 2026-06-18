import { useUserStore } from './stores/user'

const BASE_URL = 'http://localhost:3000/api'

export async function apiGet(pairId: string, type: string) {
  try {
    const response = await uni.request({
      url: `${BASE_URL}/data/${pairId}/${type}`,
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      }
    })
    return response.data || []
  } catch {
    return []
  }
}

export async function apiPost(pairId: string, type: string, data: any) {
  try {
    const response = await uni.request({
      url: `${BASE_URL}/data/${pairId}/${type}`,
      method: 'POST',
      data: data,
      header: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch {
    return null
  }
}

export async function apiPut(pairId: string, type: string, id: string, data: any) {
  try {
    const response = await uni.request({
      url: `${BASE_URL}/data/${pairId}/${type}/${id}`,
      method: 'PUT',
      data: data,
      header: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch {
    return null
  }
}

export async function apiDelete(pairId: string, type: string, id: string) {
  try {
    const response = await uni.request({
      url: `${BASE_URL}/data/${pairId}/${type}/${id}`,
      method: 'DELETE',
      header: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch {
    return null
  }
}
