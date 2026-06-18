import { useUserStore } from './stores/user'

// 自动检测环境：本地开发用 localhost，部署后用当前域名
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const BASE_URL = isDev ? 'http://localhost:3000/api' : '/api'

// 数据存储键名
function dataKey(pairId: string, type: string) {
  return `tongyan_data_${pairId}_${type}`
}

// 从 localStorage 读取数据
function loadFromStorage(pairId: string, type: string): any[] {
  try {
    const raw = uni.getStorageSync(dataKey(pairId, type))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// 保存到 localStorage
function saveToStorage(pairId: string, type: string, data: any[]) {
  uni.setStorageSync(dataKey(pairId, type), JSON.stringify(data))
}

export async function apiGet(pairId: string, type: string) {
  return loadFromStorage(pairId, type)
}

export async function apiPost(pairId: string, type: string, data: any) {
  const records = loadFromStorage(pairId, type)
  const newRecord = {
    id: 'item_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    pairId,
    type,
    ...data,
    createdAt: new Date().toISOString()
  }
  records.push(newRecord)
  saveToStorage(pairId, type, records)
  return newRecord
}

export async function apiPut(pairId: string, type: string, id: string, data: any) {
  const records = loadFromStorage(pairId, type)
  const index = records.findIndex((r: any) => r.id === id)
  if (index === -1) return null
  Object.assign(records[index], data, { updatedAt: new Date().toISOString() })
  saveToStorage(pairId, type, records)
  return records[index]
}

export async function apiDelete(pairId: string, type: string, id: string) {
  const records = loadFromStorage(pairId, type)
  const filtered = records.filter((r: any) => r.id !== id)
  saveToStorage(pairId, type, filtered)
  return { success: true }
}
