import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'

export interface BillRecord {
  id: string
  pair_id: string
  created_by: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  payer: string
}

export interface BudgetItem {
  pair_id: string
  category: string
  limit: number
  spent: number
}

export interface ShoppingItem {
  id: string
  pair_id: string
  added_by: string
  name: string
  quantity: number
  checked: boolean
}

export interface DreamFund {
  id: string
  pair_id: string
  name: string
  target: number
  current: number
  icon: string
}

export const useBillStore = defineStore('bill', () => {
  function currentPairId(): string {
    const u = useUserStore()
    return u.pairId || 'default_pair'
  }
  const records = ref<BillRecord[]>([])
  const budgets = ref<BudgetItem[]>([])
  const shoppingList = ref<ShoppingItem[]>([])
  const dreamFunds = ref<DreamFund[]>([])

  const totalIncome = computed(() => {
    return records.value
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0)
  })

  const totalExpense = computed(() => {
    return records.value
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0)
  })

  const balance = computed(() => totalIncome.value - totalExpense.value)

  async function loadData() {
    const pid = currentPairId()
    console.log('[BILL QUERY] ======================================')
    console.log('[BILL QUERY] Executing query with Pair ID:', pid)
    console.log('[BILL QUERY] SELECT * FROM bills WHERE pair_id =', pid)
    console.log('[BILL QUERY] ======================================')

    const [recs, budgs, shop, dreams] = await Promise.all([
      apiGet(pid, 'bills'),
      apiGet(pid, 'budgets'),
      apiGet(pid, 'shopping'),
      apiGet(pid, 'dreams')
    ])
    
    records.value = recs || []
    budgets.value = budgs || []
    shoppingList.value = shop || []
    dreamFunds.value = dreams || []
  }

  async function addRecord(record: Omit<BillRecord, 'id' | 'pair_id' | 'created_by'>) {
    const userStore = useUserStore()
    const pid = currentPairId()
    
    const newRecord = {
      ...record,
      created_by: userStore.userId || ''
    }

    const result = await apiPost(pid, 'bills', newRecord)
    if (result) {
      records.value.unshift(result)
    }
  }

  async function addShoppingItem(item: Omit<ShoppingItem, 'id' | 'pair_id' | 'added_by' | 'checked'>) {
    const userStore = useUserStore()
    const pid = currentPairId()
    
    const newItem = {
      ...item,
      added_by: userStore.userId || '',
      checked: false
    }

    const result = await apiPost(pid, 'shopping', newItem)
    if (result) {
      shoppingList.value.unshift(result)
    }
  }

  async function toggleShoppingItem(id: string) {
    const item = shoppingList.value.find(s => s.id === id)
    if (item) {
      const pid = currentPairId()
      const result = await apiPut(pid, 'shopping', id, { checked: !item.checked })
      if (result) {
        item.checked = !item.checked
      }
    }
  }

  async function deleteShoppingItem(id: string) {
    const pid = currentPairId()
    const result = await apiDelete(pid, 'shopping', id)
    if (result?.success) {
      shoppingList.value = shoppingList.value.filter(s => s.id !== id)
    }
  }

  async function addDreamFund(fund: Omit<DreamFund, 'id' | 'pair_id' | 'current'>) {
    const pid = currentPairId()
    
    const newFund = {
      ...fund,
      current: 0
    }

    const result = await apiPost(pid, 'dreams', newFund)
    if (result) {
      dreamFunds.value.push(result)
    }
  }

  async function addToDreamFund(id: string, amount: number) {
    const fund = dreamFunds.value.find(f => f.id === id)
    if (fund) {
      const pid = currentPairId()
      const newCurrent = fund.current + amount
      const result = await apiPut(pid, 'dreams', id, { current: newCurrent })
      if (result) {
        fund.current = newCurrent
      }
    }
  }

  async function setBudget(category: string, limit: number) {
    const pid = currentPairId()
    const existing = budgets.value.find(b => b.category === category)
    
    if (existing) {
      const result = await apiPut(pid, 'budgets', existing.id, { limit, spent: existing.spent })
      if (result) {
        existing.limit = limit
      }
    } else {
      const newBudget = { category, limit, spent: 0 }
      const result = await apiPost(pid, 'budgets', newBudget)
      if (result) {
        budgets.value.push(result)
      }
    }
  }

  async function addBudget(budget: Omit<BudgetItem, 'pair_id'>) {
    const pid = currentPairId()
    const result = await apiPost(pid, 'budgets', budget)
    if (result) {
      budgets.value.push(result)
    }
  }

  return {
    records,
    budgets,
    shoppingList,
    dreamFunds,
    totalIncome,
    totalExpense,
    balance,
    loadData,
    addRecord,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    addDreamFund,
    addToDreamFund,
    setBudget
  }
})
