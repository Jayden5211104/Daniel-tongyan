import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'

export interface Message {
  id: string
  pair_id: string
  sender_id: string
  content: string
  sender: string
  timestamp: string
  type: 'text' | 'image' | 'voice'
}

export interface Anniversary {
  id: string
  pair_id: string
  name: string
  date: string
  type: 'birthday' | 'anniversary' | 'other'
  year: boolean
}

export interface Affirmation {
  id: string
  pair_id: string
  content: string
  giver: string
  giver_id: string
  receiver: string
  timestamp: string
}

export const useEmotionStore = defineStore('emotion', () => {
  function currentPairId(): string {
    const u = useUserStore()
    return u.pairId || 'default_pair'
  }
  const messages = ref<Message[]>([])
  const anniversaries = ref<Anniversary[]>([])
  const affirmations = ref<Affirmation[]>([])

  const upcomingAnniversaries = computed(() => {
    const now = new Date()
    return anniversaries.value
      .map(a => {
        const date = new Date(a.date)
        let nextDate = new Date(date)
        nextDate.setFullYear(now.getFullYear())

        if (nextDate < now && !a.year) {
          nextDate.setFullYear(now.getFullYear() + 1)
        }

        const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return { ...a, daysLeft: diffDays }
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5)
  })

  async function loadData() {
    const pid = currentPairId()
    console.log('[EMOTION QUERY] ======================================')
    console.log('[EMOTION QUERY] Executing query with Pair ID:', pid)
    console.log('[EMOTION QUERY] SELECT * FROM emotions WHERE pair_id =', pid)
    console.log('[EMOTION QUERY] ======================================')

    const [msgs, annivs, affirms] = await Promise.all([
      apiGet(pid, 'emotions'),
      apiGet(pid, 'anniversaries'),
      apiGet(pid, 'affirmations')
    ])
    
    messages.value = msgs || []
    anniversaries.value = annivs || []
    affirmations.value = affirms || []
  }

  async function addMessage(message: Omit<Message, 'id' | 'timestamp' | 'pair_id' | 'sender_id'>) {
    const userStore = useUserStore()
    const pid = currentPairId()
    
    const newMsg = {
      ...message,
      sender_id: userStore.userId || '',
      timestamp: new Date().toISOString()
    }

    const result = await apiPost(pid, 'emotions', newMsg)
    if (result) {
      messages.value.push(result)
    }
  }

  async function addAnniversary(anniversary: Omit<Anniversary, 'id' | 'pair_id'>) {
    const pid = currentPairId()
    const result = await apiPost(pid, 'anniversaries', anniversary)
    if (result) {
      anniversaries.value.push(result)
    }
  }

  async function updateAnniversary(anniversary: Anniversary) {
    const pid = currentPairId()
    const result = await apiPut(pid, 'anniversaries', anniversary.id, anniversary)
    if (result) {
      const index = anniversaries.value.findIndex(a => a.id === anniversary.id)
      if (index !== -1) {
        anniversaries.value[index] = result
      }
    }
  }

  async function deleteAnniversary(id: string) {
    const pid = currentPairId()
    const result = await apiDelete(pid, 'anniversaries', id)
    if (result?.success) {
      anniversaries.value = anniversaries.value.filter(a => a.id !== id)
    }
  }

  async function addAffirmation(affirmation: Omit<Affirmation, 'id' | 'pair_id' | 'timestamp' | 'giver_id'>) {
    const userStore = useUserStore()
    const pid = currentPairId()
    
    const newAffirm = {
      ...affirmation,
      giver_id: userStore.userId || '',
      timestamp: new Date().toISOString()
    }

    const result = await apiPost(pid, 'affirmations', newAffirm)
    if (result) {
      affirmations.value.push(result)
    }
  }

  return {
    messages,
    anniversaries,
    affirmations,
    upcomingAnniversaries,
    loadData,
    addMessage,
    addAnniversary,
    updateAnniversary,
    deleteAnniversary,
    addAffirmation
  }
})
