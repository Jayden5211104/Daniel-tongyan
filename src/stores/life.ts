import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'

export interface Chore {
  id: string
  pair_id: string
  name: string
  cycle: 'daily' | 'weekly' | 'monthly'
  assignee: string
  completed: boolean
  lastDone: string
  nextDue: string
}

export interface InventoryItem {
  id: string
  pair_id: string
  name: string
  category: string
  quantity: number
  unit: string
  lowStock: boolean
}

export interface TravelPlan {
  id: string
  pair_id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  budget: number
  checklist: { id: string; item: string; done: boolean }[]
}

export interface Recipe {
  id: string
  pair_id: string
  name: string
  category: string
  ingredients: string[]
  steps: string[]
  servings: number
  favorite: boolean
}

import { useUserStore } from './user'

export const useLifeStore = defineStore('life', () => {
  function currentPairId(): string {
    const u = useUserStore()
    return u.pairId || 'default_pair'
  }
  const chores = ref<Chore[]>([])
  const inventory = ref<InventoryItem[]>([])
  const travelPlans = ref<TravelPlan[]>([])
  const recipes = ref<Recipe[]>([])

  async function loadData() {
    const pid = currentPairId()
    const [chs, inv, travel, rec] = await Promise.all([
      apiGet(pid, 'chores'),
      apiGet(pid, 'inventory'),
      apiGet(pid, 'travel'),
      apiGet(pid, 'recipes')
    ])
    chores.value = chs || []
    inventory.value = inv || []
    travelPlans.value = travel || []
    recipes.value = rec || []
  }

  async function addChore(chore: Omit<Chore, 'id' | 'pair_id' | 'completed'>) {
    const pid = currentPairId()
    const newChore = { ...chore, completed: false }
    const result = await apiPost(pid, 'chores', newChore)
    if (result) { chores.value.push(result) }
  }

  async function toggleChore(id: string) {
    const chore = chores.value.find(c => c.id === id)
    if (chore) {
      const pid = currentPairId()
      const result = await apiPut(pid, 'chores', id, {
        completed: !chore.completed,
        lastDone: new Date().toISOString()
      })
      if (result) {
        chore.completed = !chore.completed
        chore.lastDone = result.lastDone
      }
    }
  }

  async function addInventoryItem(item: Omit<InventoryItem, 'id' | 'pair_id' | 'lowStock'>) {
    const pid = currentPairId()
    const newItem = { ...item, lowStock: item.quantity < 5 }
    const result = await apiPost(pid, 'inventory', newItem)
    if (result) { inventory.value.push(result) }
  }

  async function updateInventoryItem(item: Omit<InventoryItem, 'pair_id'>) {
    const pid = currentPairId()
    const result = await apiPut(pid, 'inventory', item.id, {
      ...item,
      lowStock: item.quantity < 5
    })
    if (result) {
      const idx = inventory.value.findIndex(i => i.id === item.id)
      if (idx !== -1) { inventory.value[idx] = result }
    }
  }

  async function deleteInventoryItem(id: string) {
    const pid = currentPairId()
    const result = await apiDelete(pid, 'inventory', id)
    if (result?.success) { inventory.value = inventory.value.filter(i => i.id !== id) }
  }

  async function addTravelPlan(plan: Omit<TravelPlan, 'id' | 'pair_id'>) {
    const pid = currentPairId()
    const result = await apiPost(pid, 'travel', plan)
    if (result) { travelPlans.value.push(result) }
  }

  async function updateTravelPlan(plan: Omit<TravelPlan, 'pair_id'>) {
    const pid = currentPairId()
    const result = await apiPut(pid, 'travel', plan.id, plan)
    if (result) {
      const idx = travelPlans.value.findIndex(p => p.id === plan.id)
      if (idx !== -1) { travelPlans.value[idx] = result }
    }
  }

  async function deleteTravelPlan(id: string) {
    const pid = currentPairId()
    const result = await apiDelete(pid, 'travel', id)
    if (result?.success) { travelPlans.value = travelPlans.value.filter(p => p.id !== id) }
  }

  async function toggleTravelChecklist(planId: string, itemId: string) {
    const plan = travelPlans.value.find(p => p.id === planId)
    if (plan) {
      const newChecklist = plan.checklist.map(c =>
        c.id === itemId ? { ...c, done: !c.done } : c
      )
      const pid = currentPairId()
      const result = await apiPut(pid, 'travel', planId, { checklist: newChecklist })
      if (result) { plan.checklist = newChecklist }
    }
  }

  async function addRecipe(recipe: Omit<Recipe, 'id' | 'pair_id' | 'favorite'>) {
    const pid = currentPairId()
    const newRecipe = { ...recipe, favorite: false }
    const result = await apiPost(pid, 'recipes', newRecipe)
    if (result) { recipes.value.push(result) }
  }

  async function updateRecipe(recipe: Omit<Recipe, 'pair_id' | 'favorite'>) {
    const pid = currentPairId()
    const result = await apiPut(pid, 'recipes', recipe.id, recipe)
    if (result) {
      const idx = recipes.value.findIndex(r => r.id === recipe.id)
      if (idx !== -1) { recipes.value[idx] = result }
    }
  }

  async function deleteRecipe(id: string) {
    const pid = currentPairId()
    const result = await apiDelete(pid, 'recipes', id)
    if (result?.success) { recipes.value = recipes.value.filter(r => r.id !== id) }
  }

  async function toggleFavoriteRecipe(id: string) {
    const recipe = recipes.value.find(r => r.id === id)
    if (recipe) {
      const pid = currentPairId()
      const result = await apiPut(pid, 'recipes', id, { favorite: !recipe.favorite })
      if (result) { recipe.favorite = !recipe.favorite }
    }
  }

  return {
    chores, inventory, travelPlans, recipes,
    loadData,
    addChore, toggleChore,
    addInventoryItem, updateInventoryItem, deleteInventoryItem,
    addTravelPlan, updateTravelPlan, deleteTravelPlan, toggleTravelChecklist,
    addRecipe, updateRecipe, deleteRecipe, toggleFavoriteRecipe
  }
})
