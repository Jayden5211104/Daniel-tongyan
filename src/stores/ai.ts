import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'

export interface CalendarEvent {
  id: string
  pair_id: string
  title: string
  date: string
  startTime: string
  endTime: string
  allDay: boolean
  type: 'work' | 'personal' | 'shared'
  owner: string
  owner_id: string
}

export interface Task {
  id: string
  pair_id: string
  title: string
  description: string
  dueDate: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  subtasks: { id: string; text: string; completed: boolean }[]
}

export const useAIStore = defineStore('ai', () => {
  function currentPairId(): string {
    const u = useUserStore()
    return u.pairId || 'default_pair'
  }
  const calendarEvents = ref<CalendarEvent[]>([])
  const tasks = ref<Task[]>([])

  const todayEvents = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return calendarEvents.value.filter(e => e.date === today)
  })

  const pendingTasks = computed(() => {
    return tasks.value.filter(t => !t.completed)
  })

  async function loadData() {
    const pid = currentPairId()
    console.log('[AI QUERY] ======================================')
    console.log('[AI QUERY] Executing query with Pair ID:', pid)
    console.log('[AI QUERY] SELECT * FROM calendar_events WHERE pair_id =', pid)
    console.log('[AI QUERY] ======================================')

    const [events, ts] = await Promise.all([
      apiGet(pid, 'calendar_events'),
      apiGet(pid, 'tasks')
    ])
    
    calendarEvents.value = events || []
    tasks.value = ts || []
  }

  async function addEvent(event: Omit<CalendarEvent, 'id' | 'pair_id' | 'owner_id'>) {
    const userStore = useUserStore()
    const pid = currentPairId()
    
    const newEvent = {
      ...event,
      owner_id: userStore.userId || ''
    }

    const result = await apiPost(pid, 'calendar_events', newEvent)
    if (result) {
      calendarEvents.value.push(result)
    }
  }

  async function updateEvent(updatedEvent: CalendarEvent) {
    const pid = currentPairId()
    const result = await apiPut(pid, 'calendar_events', updatedEvent.id, updatedEvent)
    if (result) {
      const index = calendarEvents.value.findIndex(e => e.id === updatedEvent.id)
      if (index !== -1) {
        calendarEvents.value.splice(index, 1, result)
      }
    }
  }

  async function removeEvent(id: string) {
    const pid = currentPairId()
    const result = await apiDelete(pid, 'calendar_events', id)
    if (result?.success) {
      calendarEvents.value = calendarEvents.value.filter(e => e.id !== id)
    }
  }

  async function addTask(task: Omit<Task, 'id' | 'pair_id'>) {
    const pid = currentPairId()
    const newTask = {
      ...task,
      completed: false,
      subtasks: task.subtasks || []
    }

    const result = await apiPost(pid, 'tasks', newTask)
    if (result) {
      tasks.value.push(result)
    }
  }

  async function toggleTask(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      const pid = currentPairId()
      const result = await apiPut(pid, 'tasks', id, { completed: !task.completed })
      if (result) {
        task.completed = !task.completed
      }
    }
  }

  async function addSubtask(taskId: string, text: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      const pid = currentPairId()
      const newSubtasks = [...task.subtasks, { id: Date.now().toString(), text, completed: false }]
      const result = await apiPut(pid, 'tasks', taskId, { subtasks: newSubtasks })
      if (result) {
        task.subtasks = newSubtasks
      }
    }
  }

  async function toggleSubtask(taskId: string, subtaskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      const subtask = task.subtasks.find(s => s.id === subtaskId)
      if (subtask) {
        const pid = currentPairId()
        const newSubtasks = task.subtasks.map(s => 
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        )
        const result = await apiPut(pid, 'tasks', taskId, { subtasks: newSubtasks })
        if (result) {
          subtask.completed = !subtask.completed
        }
      }
    }
  }

  return {
    calendarEvents,
    tasks,
    todayEvents,
    pendingTasks,
    loadData,
    addEvent,
    updateEvent,
    removeEvent,
    addTask,
    toggleTask,
    addSubtask,
    toggleSubtask
  }
})
