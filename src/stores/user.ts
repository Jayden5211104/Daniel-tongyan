import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Pair {
  id: string
  secret_code: string
  created_at: string
}

interface User {
  id: string
  pair_id: string
  name: string
  role: 'user' | 'partner'
  created_at: string
}

interface LoginResult {
  token: string
  user_id: string
  pair_id: string
  user: User
  pair: Pair
}

const PAIRS_KEY = 'pairs_table'
const USERS_KEY = 'users_table'
const TOKEN_KEY = 'auth_token'
const USER_ID_KEY = 'auth_user_id'
const PAIR_ID_KEY = 'auth_pair_id'

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function genToken() {
  return `tk_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

function loadPairs(): Pair[] {
  return uni.getStorageSync(PAIRS_KEY) || []
}

function savePairs(pairs: Pair[]) {
  uni.setStorageSync(PAIRS_KEY, pairs)
}

function loadUsers(): User[] {
  return uni.getStorageSync(USERS_KEY) || []
}

function saveUsers(users: User[]) {
  uni.setStorageSync(USERS_KEY, users)
}

export const useUserStore = defineStore('user', () => {
  const cipher = ref('')
  const isFirstLogin = ref(true)
  const userName = ref('')
  const partnerName = ref('')
  const currentRole = ref<'user' | 'partner'>('user')
  const userId = ref('')
  const pairId = ref('')
  const token = ref('')

  const hasCipher = computed(() => !!cipher.value)
  const isLoggedIn = computed(() => !!token.value && !!userId.value && !!pairId.value)

  const currentUserName = computed(() => {
    return currentRole.value === 'user' ? userName.value : partnerName.value
  })

  function setCipher(value: string) {
    cipher.value = value
    isFirstLogin.value = false
    uni.setStorageSync('cipher', value)
    uni.setStorageSync('isFirstLogin', 'false')
  }

  function loadCipher() {
    const storedCipher = uni.getStorageSync('cipher')
    const storedIsFirstLogin = uni.getStorageSync('isFirstLogin')

    if (storedCipher) {
      cipher.value = storedCipher
    }
    if (storedIsFirstLogin === 'false') {
      isFirstLogin.value = false
    }
  }

  function setUserNames(user: string, partner: string) {
    userName.value = user
    partnerName.value = partner
    uni.setStorageSync('userName', user)
    uni.setStorageSync('partnerName', partner)
  }

  function loadUserNames() {
    userName.value = uni.getStorageSync('userName') || ''
    partnerName.value = uni.getStorageSync('partnerName') || ''
  }

  function setCurrentRole(role: 'user' | 'partner') {
    currentRole.value = role
    uni.setStorageSync('currentRole', role)
  }

  function loadCurrentRole() {
    const storedRole = uni.getStorageSync('currentRole') as 'user' | 'partner'
    if (storedRole === 'user' || storedRole === 'partner') {
      currentRole.value = storedRole
    }
  }

  function setSession(tokenValue: string, userIdValue: string, pairIdValue: string) {
    token.value = tokenValue
    userId.value = userIdValue
    pairId.value = pairIdValue
    uni.setStorageSync(TOKEN_KEY, tokenValue)
    uni.setStorageSync(USER_ID_KEY, userIdValue)
    uni.setStorageSync(PAIR_ID_KEY, pairIdValue)
  }

  function loadSession() {
    token.value = uni.getStorageSync(TOKEN_KEY) || ''
    userId.value = uni.getStorageSync(USER_ID_KEY) || ''
    pairId.value = uni.getStorageSync(PAIR_ID_KEY) || ''
  }

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const API_BASE = isDev ? 'http://localhost:3000/api' : '/api'

async function login(secretCode: string, name: string, role: 'user' | 'partner'): Promise<LoginResult> {
    if (!secretCode || secretCode.length < 6) {
      throw new Error('暗号至少需要6位')
    }
    if (!name) {
      throw new Error('请输入名字')
    }

    try {
      const response = await uni.request({
        url: `${API_BASE}/login`,
        method: 'POST',
        data: {
          secret_code: secretCode,
          name: name,
          role: role
        },
        header: {
          'Content-Type': 'application/json'
        }
      })

      if (response.statusCode === 200) {
        const result = response.data as LoginResult
        
        setSession(result.token, result.user_id, result.pair_id)
        setCipher(secretCode)
        currentRole.value = role

        // Fetch partner name from backend
        try {
          const partnerResp = await uni.request({
            url: `${API_BASE}/partner/${result.pair_id}/${result.user_id}`,
            method: 'GET'
          })
          const backendPartnerName = (partnerResp.data as any)?.name || ''
          if (role === 'user') {
            // Keep existing partnerName if backend returns empty (first login scenario)
            const pName = backendPartnerName || partnerName.value
            setUserNames(name, pName)
          } else {
            const pName = backendPartnerName || userName.value
            setUserNames(pName, name)
          }
        } catch {
          // On error, keep existing names
          if (role === 'user') {
            setUserNames(name, partnerName.value)
          } else {
            setUserNames(userName.value, name)
          }
        }

        console.log('[LOGIN SUCCESS] ======================================')
        console.log('[LOGIN SUCCESS] User:', result.user.name, '(ID:', result.user_id + ')')
        console.log('[LOGIN SUCCESS] Pair ID:', result.pair_id)
        console.log('[LOGIN SUCCESS] Role:', role)
        console.log('[LOGIN SUCCESS] Token:', result.token)
        console.log('[LOGIN SUCCESS] userName:', userName.value, 'partnerName:', partnerName.value)
        console.log('[LOGIN SUCCESS] ======================================')

        return result
      } else {
        throw new Error(response.data?.error || '登录失败')
      }
    } catch (e: any) {
      console.error('[LOGIN ERROR]', e.message)
      throw new Error('网络请求失败，请确保后端服务器已启动')
    }
  }

  function logout() {
    token.value = ''
    userId.value = ''
    pairId.value = ''
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(USER_ID_KEY)
    uni.removeStorageSync(PAIR_ID_KEY)
  }

  function clearAll() {
    cipher.value = ''
    isFirstLogin.value = true
    userName.value = ''
    partnerName.value = ''
    userId.value = ''
    pairId.value = ''
    token.value = ''
    uni.removeStorageSync('cipher')
    uni.removeStorageSync('isFirstLogin')
    uni.removeStorageSync('userName')
    uni.removeStorageSync('partnerName')
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(USER_ID_KEY)
    uni.removeStorageSync(PAIR_ID_KEY)
  }

  return {
    cipher,
    isFirstLogin,
    userName,
    partnerName,
    currentRole,
    userId,
    pairId,
    token,
    currentUserName,
    hasCipher,
    isLoggedIn,
    setCipher,
    loadCipher,
    setUserNames,
    loadUserNames,
    setCurrentRole,
    loadCurrentRole,
    setSession,
    loadSession,
    login,
    logout,
    clearAll
  }
})
