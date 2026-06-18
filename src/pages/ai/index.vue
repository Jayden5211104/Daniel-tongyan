<template>
  <view class="ai-container">
    <!-- 主页 -->
    <view v-if="activePage === 'main'" class="main-page">
      <view class="nav-bar">
        <text class="nav-title">智能管家</text>
      </view>
      <view class="main-content">
        <view class="menu-card" @click="activePage = 'calendar'">
          <text class="menu-icon">📅</text>
          <text class="menu-text">日历周记录</text>
        </view>
        <view class="menu-card" @click="activePage = 'schedule'">
          <text class="menu-icon">💡</text>
          <text class="menu-text">智能日程建议</text>
        </view>
        <view class="menu-card" @click="activePage = 'task'">
          <text class="menu-icon">🌿</text>
          <text class="menu-text">药膳养生助手</text>
        </view>
      </view>
    </view>

    <!-- 日历页 -->
    <view v-else-if="activePage === 'calendar'" class="sub-page">
      <view class="page-header">
        <view class="header-left" @click="activePage = 'main'"><text class="back-icon">←</text></view>
        <text class="header-title">日历计划本</text>
        <view class="header-right"></view>
      </view>

      <scroll-view scroll-y class="sub-scroll">
        <view class="sub-content">
          <view class="owner-tabs">
            <view :class="['owner-tab', { active: activeCalendar === 'me' }]" @click="activeCalendar = 'me'"><text>{{ userStore.userName || '我' }}</text></view>
            <view :class="['owner-tab', { active: activeCalendar === 'partner' }]" @click="activeCalendar = 'partner'"><text>{{ userStore.partnerName || '伴侣' }}</text></view>
            <view :class="['owner-tab', { active: activeCalendar === 'both' }]" @click="activeCalendar = 'both'"><text>一起看</text></view>
          </view>

          <view v-if="activeCalendar === 'both'" class="dual-cal-plan">
            <view class="cal-col-plan">
              <view class="cal-owner-tag me"><text>{{ userStore.userName || '我' }}</text></view>
              <view class="cal-box-plan">
                <view class="cal-header">
                  <view class="month-nav" @click="prevMonth"><text>‹</text></view>
                  <text class="cal-month">{{ currentMonthText }}</text>
                  <view class="month-nav" @click="nextMonth"><text>›</text></view>
                </view>
                <view class="weekday-row"><text v-for="d in weekdays" :key="d" class="weekday">{{ d }}</text></view>
                <view class="cal-grid-plan">
                  <view v-for="(day, i) in calendarDays" :key="i" :class="['cal-day-plan', { dim: !day.currentMonth, today: day.isToday, sel: day.date === selectedDateMe }]" @click="onDayClickMe(day)">
                    <text class="day-num-plan">{{ day.day }}</text>
                    <view v-for="(ev, ei) in day.eventsMe.slice(0, 2)" :key="ei" class="cal-event-tag me">
                      <text class="cal-event-text">{{ ev.title }}{{ formatEventTime(ev) }}</text>
                    </view>
                    <view v-if="day.eventsMe.length > 2" class="cal-more-tag">
                      <text>+{{ day.eventsMe.length - 2 }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            <view class="cal-col-plan">
              <view class="cal-owner-tag partner"><text>{{ userStore.partnerName || '伴侣' }}</text></view>
              <view class="cal-box-plan">
                <view class="cal-header">
                  <view class="month-nav" @click="prevMonth"><text>‹</text></view>
                  <text class="cal-month">{{ currentMonthText }}</text>
                  <view class="month-nav" @click="nextMonth"><text>›</text></view>
                </view>
                <view class="weekday-row"><text v-for="d in weekdays" :key="d" class="weekday">{{ d }}</text></view>
                <view class="cal-grid-plan">
                  <view v-for="(day, i) in calendarDays" :key="i" :class="['cal-day-plan', { dim: !day.currentMonth, today: day.isToday, sel: day.date === selectedDatePartner }]" @click="onDayClickPartner(day)">
                    <text class="day-num-plan">{{ day.day }}</text>
                    <view v-for="(ev, ei) in day.eventsPartner.slice(0, 2)" :key="ei" class="cal-event-tag partner">
                      <text class="cal-event-text">{{ ev.title }}{{ formatEventTime(ev) }}</text>
                    </view>
                    <view v-if="day.eventsPartner.length > 2" class="cal-more-tag">
                      <text>+{{ day.eventsPartner.length - 2 }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view v-else class="cal-box">
            <view class="cal-header">
              <view class="month-nav" @click="prevMonth"><text>‹</text></view>
              <text class="cal-month">{{ currentMonthText }}</text>
              <view class="month-nav" @click="nextMonth"><text>›</text></view>
            </view>
            <view class="weekday-row"><text v-for="d in weekdays" :key="d" class="weekday">{{ d }}</text></view>
            <view class="cal-grid-plan">
              <view v-for="(day, i) in calendarDays" :key="i" :class="['cal-day-plan', { dim: !day.currentMonth, today: day.isToday, sel: day.date === selectedDate.value }]" @click="onDayClick(day)">
                <text class="day-num-plan">{{ day.day }}</text>
                <view v-for="(ev, ei) in (activeCalendar === 'me' ? day.eventsMe : day.eventsPartner).slice(0, 2)" :key="ei" :class="['cal-event-tag', activeCalendar === 'me' ? 'me' : 'partner']">
                  <text class="cal-event-text">{{ ev.title }}{{ formatEventTime(ev) }}</text>
                </view>
                <view v-if="(activeCalendar === 'me' ? day.eventsMe : day.eventsPartner).length > 2" class="cal-more-tag">
                  <text>+{{ (activeCalendar === 'me' ? day.eventsMe : day.eventsPartner).length - 2 }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="spare-card">
            <text class="section-label">双方空闲日期</text>
            <view class="spare-tags">
              <view v-for="date in spareDates" :key="date" class="spare-tag"><text>{{ formatDate(date) }}</text></view>
              <view v-if="spareDates.length === 0" class="spare-empty"><text>暂无共同空闲日期</text></view>
            </view>
          </view>

          <view class="add-btn" @click="openAddEventModal">
            <text class="add-icon">+</text>
            <text class="add-text">添加日程</text>
          </view>

          <view v-if="dayEvents.length > 0" class="event-list">
            <text class="section-label">{{ formatDate(selectedDate.value) }} 的日程</text>
            <view v-for="event in dayEvents" :key="event.id" class="event-item">
              <view class="event-time-cell"><text>{{ event.allDay ? '全天' : event.time }}</text></view>
              <view class="event-info">
                <text class="event-title">{{ event.title }}{{ formatEventTime(event) }}</text>
                <text class="event-meta">{{ event.owner }} · {{ typeMap[event.type] }}</text>
              </view>
              <view :class="['event-tag', event.owner === userStore.userName ? 'me' : 'partner']"><text>{{ event.owner === userStore.userName ? '我' : 'TA' }}</text></view>
            </view>
          </view>
          <view v-else class="empty-state" style="padding: 40rpx 0;">
            <text class="empty-icon">📋</text>
            <text class="empty-text">该日暂无日程</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 智能日程建议 -->
    <view v-else-if="activePage === 'schedule'" class="sub-page">
      <view class="page-header">
        <view class="header-left" @click="activePage = 'main'"><text class="back-icon">←</text></view>
        <text class="header-title">智能日程建议</text>
        <view class="header-right"></view>
      </view>
      <scroll-view scroll-y class="sub-scroll">
        <view class="sub-content">
          <view class="weather-card">
            <text class="weather-icon">{{ weatherIcon }}</text>
            <view class="weather-info">
              <text class="weather-temp">{{ weatherTemp }}°C</text>
              <text class="weather-desc">{{ weatherDesc }}</text>
            </view>
          </view>
          <view class="spare-section">
            <text class="section-label">共同空闲日期</text>
            <view v-if="spareDates.length > 0" class="spare-list">
              <view v-for="(date, i) in spareDates.slice(0, 5)" :key="date" class="spare-row" @click="selectSpareDate(date)">
                <text class="spare-date">{{ formatDate(date) }}</text>
                <text class="spare-wd">{{ getWeekday(date) }}</text>
                <view v-if="i === 0" class="best-tag"><text>最佳</text></view>
              </view>
            </view>
          </view>
          <view class="suggestion-section">
            <text class="section-label">约会活动推荐</text>
            <view v-if="dateSuggestions.length > 0" class="sug-list">
              <view v-for="s in dateSuggestions" :key="s.id" class="sug-card">
                <view class="sug-header">
                  <text class="sug-icon">{{ s.icon }}</text>
                  <text class="sug-title">{{ s.title }}</text>
                </view>
                <text class="sug-desc">{{ s.description }}</text>
                <view class="sug-tags"><view v-for="t in s.tags" :key="t" class="sug-tag"><text>{{ t }}</text></view></view>
                <view class="sug-action" @click="addSuggestionToCalendar(s)"><text>添加到日历</text></view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 药膳养生 -->
    <view v-else-if="activePage === 'task'" class="sub-page">
      <view class="page-header">
        <view class="header-left" @click="activePage = 'main'"><text class="back-icon">←</text></view>
        <text class="header-title">药膳养生助手</text>
        <view class="header-right"></view>
      </view>
      <scroll-view scroll-y class="sub-scroll">
        <view class="sub-content">
          <view class="chat-box">
            <view class="chat-msgs">
              <view v-for="msg in healthMessages" :key="msg.id" :class="['chat-msg', msg.type]">
                <view v-if="msg.type === 'user'" class="msg-avatar user"><text>{{ userStore.currentUserName?.charAt(0) || '我' }}</text></view>
                <view class="msg-body">
                  <text class="msg-text">{{ msg.content }}</text>
                  <view v-if="msg.images && msg.images.length > 0" class="msg-imgs">
                    <image v-for="img in msg.images" :key="img" :src="img" mode="aspectFit" class="msg-img" />
                  </view>
                  <view v-if="msg.recipe" class="recipe-card">
                    <text class="rcp-title">{{ msg.recipe.name }}</text>
                    <view class="rcp-row"><text class="rcp-label">材料：</text><text class="rcp-text">{{ msg.recipe.ingredients }}</text></view>
                    <view class="rcp-row"><text class="rcp-label">做法：</text><text class="rcp-text">{{ msg.recipe.steps }}</text></view>
                    <view class="rcp-row"><text class="rcp-label">功效：</text><text class="rcp-text">{{ msg.recipe.effect }}</text></view>
                    <view v-if="msg.recipe.herbs && msg.recipe.herbs.length > 0" class="herb-list">
                      <text class="rcp-label">药材说明：</text>
                      <view v-for="herb in msg.recipe.herbs" :key="herb.name" class="herb-info">
                        <text class="herb-name">{{ herb.name }}</text>
                        <text class="herb-desc">{{ herb.description }}</text>
                      </view>
                    </view>
                  </view>
                </view>
                <view v-if="msg.type === 'assistant'" class="msg-avatar asst"><text>🌿</text></view>
              </view>
            </view>
            <view class="chat-input-area">
              <view class="chat-input-row">
                <view class="img-upload" @click="uploadHealthImage"><text>📷</text></view>
                <input v-model="healthInput" type="text" placeholder="描述症状或上传药方..." class="chat-input" @confirm="sendHealthMessage" />
                <view class="send-btn" @click="sendHealthMessage"><text>发送</text></view>
              </view>
              <view v-if="healthImages.length > 0" class="preview-row">
                <view v-for="(img, i) in healthImages" :key="i" class="preview-item">
                  <image :src="img" mode="aspectFit" class="preview-img" />
                  <view class="remove-img" @click="removeHealthImage(i)"><text>×</text></view>
                </view>
              </view>
            </view>
          </view>
          <view class="quick-box">
            <text class="quick-title">常见问题</text>
            <view class="quick-tags">
              <view class="quick-tag" @click="askQuickQuestion('最近失眠多梦，有什么食疗方子？')"><text>失眠多梦</text></view>
              <view class="quick-tag" @click="askQuickQuestion('脾胃虚弱，消化不好怎么办？')"><text>脾胃虚弱</text></view>
              <view class="quick-tag" @click="askQuickQuestion('气血不足，面色苍白吃什么？')"><text>气血不足</text></view>
              <view class="quick-tag" @click="askQuickQuestion('最近容易疲劳，精神不振')"><text>疲劳乏力</text></view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 弹窗: 添加/编辑日程 -->
    <view v-if="showEventModal" class="modal-overlay" @click="showEventModal = false">
      <view class="modal-sheet" @click.stop>
        <text class="modal-title">{{ editingEvent ? '编辑日程' : '添加日程' }}</text>
        <view class="modal-body">
          <view class="form-group"><text class="form-label">标题</text><input v-model="eventForm.title" type="text" placeholder="输入日程标题" class="glass-input" /></view>
          <view class="form-group"><text class="form-label">日期</text><input v-model="eventForm.date" type="date" class="glass-input" /></view>
          <view class="form-group row"><view :class="['check-box', { checked: eventForm.allDay }]" @click="eventForm.allDay = !eventForm.allDay"><text v-if="eventForm.allDay" class="check-icon">✓</text></view><text class="check-label">全天</text></view>
          <view v-if="!eventForm.allDay" class="form-group"><text class="form-label">起始时间</text><input v-model="eventForm.startTime" type="time" class="glass-input" /></view>
          <view v-if="!eventForm.allDay" class="form-group"><text class="form-label">结束时间</text><input v-model="eventForm.endTime" type="time" class="glass-input" /></view>
          <view class="form-group"><text class="form-label">类型</text><view class="options-row"><view v-for="t in eventTypes" :key="t.value" :class="['opt-btn', { active: eventForm.type === t.value }]" @click="eventForm.type = t.value"><text>{{ t.icon }} {{ t.label }}</text></view></view></view>
          <view class="form-group">
            <text class="form-label">所属人</text>
            <view class="glass-picker" @click="openDropdown('owner')">
              <text>{{ eventForm.owner || '选择所属人' }}</text><text class="picker-arrow">›</text>
            </view>
            <view v-if="openDropdownName === 'owner'" class="custom-dropdown">
              <view v-for="(name, idx) in owners" :key="idx" :class="['dropdown-item', { active: eventForm.owner === name }]" @click="selectOwner(name)">
                <text>{{ name }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="modal-actions"><button @click="showEventModal = false" class="btn-glass">取消</button><button @click="addEvent" class="btn-accent">保存</button></view>
      </view>
    </view>

    <!-- 弹窗: 日程详情 -->
    <view v-if="showEventDetailModal" class="modal-overlay" @click="showEventDetailModal = false">
      <view class="modal-sheet" @click.stop>
        <view class="detail-header">
          <text class="modal-title">{{ formatDate(selectedEvents[0]?.date || '') }} 的日程</text>
          <view class="close-btn" @click="showEventDetailModal = false"><text>✕</text></view>
        </view>
        <view class="modal-body">
          <view v-if="selectedEvents.length > 0" class="detail-list">
            <view v-for="event in selectedEvents" :key="event.id" class="detail-item">
              <view class="detail-time"><text>{{ event.allDay ? '全天' : event.time }}</text></view>
              <view class="detail-info">
                <text class="detail-title">{{ event.title }}</text>
                <view class="detail-meta">
                  <view :class="['detail-tag', event.owner === userStore.userName ? 'me' : 'partner']"><text>{{ event.owner }}</text></view>
                  <text class="detail-type">{{ typeMap[event.type] }}</text>
                </view>
              </view>
              <view class="detail-actions">
                <view class="d-act edit" @click="editEvent(event)"><text>编辑</text></view>
                <view class="d-act" @click="deleteEvent(event.id)"><text>删除</text></view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <TabBar current="/pages/ai/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useAIStore } from '@/stores/ai'
import { useUserStore } from '@/stores/user'
import TabBar from '@/components/TabBar.vue'

const aiStore = useAIStore()
const userStore = useUserStore()

const activePage = ref('main'); const activeCalendar = ref('both')
const showEventModal = ref(false); const showEventDetailModal = ref(false)
const selectedEvents = ref<any[]>([])

const currentYear = ref(new Date().getFullYear()); const currentMonth = ref(new Date().getMonth())
const formatDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const todayStr = formatDateStr(new Date()); const selectedDate = ref(todayStr)
const selectedDateMe = ref(todayStr); const selectedDatePartner = ref(todayStr)

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const typeMap: Record<string,string> = { work: '工作', personal: '个人', shared: '共享' }
const eventTypes = [{ value: 'work', label: '工作', icon: '💼' }, { value: 'personal', label: '个人', icon: '👤' }, { value: 'shared', label: '共享', icon: '💑' }]

const weatherIcon = ref('☀️'); const weatherTemp = ref(26); const weatherDesc = ref('晴朗')
const selectedSpareDateValue = ref(''); const dateSuggestions = ref<any[]>([])

const healthInput = ref(''); const healthImages = ref<string[]>([])
const healthMessages = ref<any[]>([{ id: '1', type: 'assistant', content: '您好！我是药膳养生助手，可以根据您的症状或上传的药方图片，为您推荐合适的食疗方子。请问有什么可以帮助您的？' }])

const editingEvent = ref<any>(null)
const eventForm = reactive({ title: '', date: '', startTime: '', endTime: '', allDay: true, type: 'personal' as string, owner: '' })
const ownerIndex = ref(0)
const openDropdownName = ref('')
const owners = computed(() => [userStore.userName || '我', userStore.partnerName || '伴侣'])

const currentMonthText = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)

const calendarDays = computed(() => {
  const days: any[] = []; const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startDay = firstDay.getDay(); const prevLast = new Date(currentYear.value, currentMonth.value, 0).getDate()
  const myName = userStore.userName || ''
  const partnerName = userStore.partnerName || ''
  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevLast - i; const dt = formatDateStr(new Date(currentYear.value, currentMonth.value - 1, d))
    days.push({
      day: d, date: dt, currentMonth: false, isToday: false,
      events: aiStore.calendarEvents.filter(e => e.date === dt),
      eventsMe: aiStore.calendarEvents.filter(e => e.date === dt && e.owner === myName),
      eventsPartner: aiStore.calendarEvents.filter(e => e.date === dt && e.owner === partnerName)
    })
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dt = formatDateStr(new Date(currentYear.value, currentMonth.value, i))
    days.push({
      day: i, date: dt, currentMonth: true, isToday: dt === todayStr,
      events: aiStore.calendarEvents.filter(e => e.date === dt),
      eventsMe: aiStore.calendarEvents.filter(e => e.date === dt && e.owner === myName),
      eventsPartner: aiStore.calendarEvents.filter(e => e.date === dt && e.owner === partnerName)
    })
  }
  const rem = 42 - days.length
  for (let i = 1; i <= rem; i++) {
    const dt = formatDateStr(new Date(currentYear.value, currentMonth.value + 1, i))
    days.push({
      day: i, date: dt, currentMonth: false, isToday: false,
      events: aiStore.calendarEvents.filter(e => e.date === dt),
      eventsMe: aiStore.calendarEvents.filter(e => e.date === dt && e.owner === myName),
      eventsPartner: aiStore.calendarEvents.filter(e => e.date === dt && e.owner === partnerName)
    })
  }
  return days
})

const dayEvents = computed(() => {
  const base = aiStore.calendarEvents.filter(e => e.date === selectedDate.value)
  if (activeCalendar.value === 'me') return base.filter(e => e.owner === userStore.userName)
  if (activeCalendar.value === 'partner') return base.filter(e => e.owner === userStore.partnerName)
  return base
})

const spareDates = computed(() => {
  const dts: string[] = []
  for (let i = 0; i < 30; i++) { const d = new Date(); d.setDate(d.getDate() + i); const ds = formatDateStr(d); if (!aiStore.calendarEvents.some(e => e.date === ds && e.owner === userStore.userName) && !aiStore.calendarEvents.some(e => e.date === ds && e.owner === userStore.partnerName)) dts.push(ds) }
  return dts.slice(0, 7)
})

let pollTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => { aiStore.loadData(); userStore.loadUserNames(); eventForm.date = selectedDate.value; pollTimer = setInterval(() => aiStore.loadData(), 3000) })
onUnmounted(() => { if (pollTimer) { clearInterval(pollTimer); pollTimer = null } })

function prevMonth() { if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- } else currentMonth.value-- }
function nextMonth() { if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ } else currentMonth.value++ }
function selectDateMe(day: any) { selectedDateMe.value = day.date; eventForm.date = day.date; eventForm.owner = userStore.userName || '我'; const evts = aiStore.calendarEvents.filter(e => e.date === day.date); if (evts.length > 0) { selectedEvents.value = evts; showEventDetailModal.value = true } }
function selectDatePartner(day: any) { selectedDatePartner.value = day.date; eventForm.date = day.date; eventForm.owner = userStore.partnerName || '伴侣'; const evts = aiStore.calendarEvents.filter(e => e.date === day.date); if (evts.length > 0) { selectedEvents.value = evts; showEventDetailModal.value = true } }
function onDayClick(day: any) { selectedDate.value = day.date; eventForm.date = day.date; const evts = aiStore.calendarEvents.filter(e => e.date === day.date); if (evts.length > 0) { selectedEvents.value = evts; showEventDetailModal.value = true } }
function onDayClickMe(day: any) { selectedDateMe.value = day.date; eventForm.date = day.date; eventForm.owner = userStore.userName || '我'; const evts = aiStore.calendarEvents.filter(e => e.date === day.date && e.owner === userStore.userName); if (evts.length > 0) { selectedEvents.value = evts; showEventDetailModal.value = true } }
function onDayClickPartner(day: any) { selectedDatePartner.value = day.date; eventForm.date = day.date; eventForm.owner = userStore.partnerName || '伴侣'; const evts = aiStore.calendarEvents.filter(e => e.date === day.date && e.owner === userStore.partnerName); if (evts.length > 0) { selectedEvents.value = evts; showEventDetailModal.value = true } }
function formatEventTime(ev: any): string {
  if (ev.allDay) return '(全天)'
  const start = ev.startTime || ''
  const end = ev.endTime || ''
  if (start && end) return `(${start}~${end})`
  if (start) return `(${start})`
  return ''
}
function formatDate(ds: string) { if (!ds) return ''; const parts = ds.split('-'); return `${parseInt(parts[1])}月${parseInt(parts[2])}日` }
function getWeekday(ds: string) { return weekdays[new Date(ds).getDay()] }

function openAddEventModal() { editingEvent.value = null; eventForm.title = ''; eventForm.date = selectedDate.value; eventForm.startTime = ''; eventForm.endTime = ''; eventForm.allDay = true; eventForm.type = 'personal'; eventForm.owner = ''; ownerIndex.value = 0; showEventModal.value = true }
function onEventDateChange(e: any) { eventForm.date = e.detail.value }
function onEventStartTimeChange(e: any) { eventForm.startTime = e.detail.value }
function onEventEndTimeChange(e: any) { eventForm.endTime = e.detail.value }
function onOwnerChange(e: any) { ownerIndex.value = e.detail.value; eventForm.owner = owners.value[e.detail.value] }
function openDropdown(name: string) { openDropdownName.value = openDropdownName.value === name ? '' : name }
function selectOwner(name: string) { eventForm.owner = name; openDropdownName.value = '' }

function addEvent() {
  if (!eventForm.title) { uni.showToast({ title: '请输入标题', icon: 'none' }); return }
  if (!eventForm.owner) { uni.showToast({ title: '请选择所属人', icon: 'none' }); return }
  if (editingEvent.value) { aiStore.updateEvent({ id: editingEvent.value.id, title: eventForm.title, date: eventForm.date, startTime: eventForm.allDay ? '' : eventForm.startTime, endTime: eventForm.allDay ? '' : eventForm.endTime, allDay: eventForm.allDay, type: eventForm.type as any, owner: eventForm.owner }); uni.showToast({ title: '修改成功', icon: 'success' }) }
  else { aiStore.addEvent({ title: eventForm.title, date: eventForm.date, startTime: eventForm.allDay ? '' : eventForm.startTime, endTime: eventForm.allDay ? '' : eventForm.endTime, allDay: eventForm.allDay, type: eventForm.type as any, owner: eventForm.owner }); uni.showToast({ title: '添加成功', icon: 'success' }) }
  showEventModal.value = false; editingEvent.value = null; eventForm.title = ''; eventForm.date = selectedDate.value; eventForm.startTime = ''; eventForm.endTime = ''; eventForm.allDay = true; eventForm.type = 'personal'; eventForm.owner = ''; ownerIndex.value = 0
}
function editEvent(e: any) { editingEvent.value = e; eventForm.title = e.title; eventForm.date = e.date; eventForm.startTime = e.startTime || ''; eventForm.endTime = e.endTime || ''; eventForm.allDay = e.allDay; eventForm.type = e.type; eventForm.owner = e.owner; ownerIndex.value = owners.value.indexOf(e.owner); showEventModal.value = true; showEventDetailModal.value = false }
function deleteEvent(id: string) { uni.showModal({ title: '确认删除', content: '确定要删除这个日程吗？', success: (res) => { if (res.confirm) { aiStore.removeEvent(id); selectedEvents.value = selectedEvents.value.filter(e => e.id !== id); if (selectedEvents.value.length === 0) showEventDetailModal.value = false; uni.showToast({ title: '删除成功', icon: 'success' }) } } }) }

function selectSpareDate(date: string) { selectedSpareDateValue.value = date; generateSuggestions(date) }
function generateSuggestions(date: string) {
  const wd = getWeekday(date); const isWeekend = wd === '六' || wd === '日'; const s: any[] = []
  if (weatherDesc.value.includes('晴') || weatherDesc.value.includes('晴朗')) {
    if (isWeekend) { s.push({ id: '1', icon: '🌳', title: '户外公园漫步', description: '天气晴朗，适合一起去公园散步，享受阳光和自然风光。', tags: ['户外', '休闲', '晴天'] }, { id: '2', icon: '🚴', title: '骑行约会', description: '租一辆双人自行车，沿着城市绿道骑行，感受微风拂面的惬意。', tags: ['运动', '户外', '晴天'] }) }
    s.push({ id: '3', icon: '☕', title: '露天咖啡厅', description: '找一家有户外座位的咖啡厅，边喝咖啡边聊天，享受午后时光。', tags: ['休闲', '晴天', '约会'] })
  }
  if (weatherDesc.value.includes('雨') || weatherDesc.value.includes('阴')) { s.push({ id: '4', icon: '🎬', title: '电影院约会', description: '天气不太好，不如一起去看一场电影，分享爆米花和甜蜜时光。', tags: ['室内', '雨天', '经典'] }, { id: '5', icon: '🎨', title: '美术馆/博物馆', description: '一起去参观美术馆或博物馆，欣赏艺术作品，增进彼此的文化交流。', tags: ['室内', '雨天', '文化'] }) }
  s.push({ id: '6', icon: '🍳', title: '一起做饭', description: '在家一起准备一顿美食，从买菜到烹饪，享受合作的乐趣。', tags: ['居家', '美食', '亲密'] }, { id: '7', icon: '🎮', title: '游戏之夜', description: '一起玩桌游或电子游戏，在竞争中增进感情，在合作中培养默契。', tags: ['居家', '娱乐', '互动'] })
  dateSuggestions.value = s
}
function addSuggestionToCalendar(s: any) { eventForm.title = s.title; eventForm.date = selectedSpareDateValue.value; eventForm.allDay = true; eventForm.type = 'shared'; eventForm.owner = userStore.userName; ownerIndex.value = 0; showEventModal.value = true }

function uploadHealthImage() { uni.chooseImage({ count: 3, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: (res) => { healthImages.value = [...healthImages.value, ...res.tempFilePaths] } }) }
function removeHealthImage(i: number) { healthImages.value.splice(i, 1) }
async function sendHealthMessage() {
  if (!healthInput.value && healthImages.value.length === 0) { uni.showToast({ title: '请输入内容或上传图片', icon: 'none' }); return }
  healthMessages.value.push({ id: Date.now().toString(), type: 'user', content: healthInput.value, images: [...healthImages.value] })
  const q = healthInput.value; healthInput.value = ''; healthImages.value = []
  try { const resp = await callDeepSeekAPI(q); healthMessages.value.push({ id: Date.now().toString(), type: 'assistant', content: resp }) } catch { uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' }); setTimeout(() => healthMessages.value.push(generateHealthResponse(q)), 500) }
}
async function callDeepSeekAPI(q: string) {
  const r = await fetch('https://api.deepseek.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-45606a1a998b48319d4f3b51d20e4ee8' }, body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: '你是一位温柔暖心的药膳养生医生，擅长中医食疗养生。请用温柔、关怀的语气回答用户的健康问题，提供专业但易懂的食疗建议。' }, { role: 'user', content: q }], temperature: 0.7, max_tokens: 2000 }) })
  const d = await r.json(); return d.choices[0].message.content
}
function askQuickQuestion(q: string) { healthInput.value = q; sendHealthMessage() }
function generateHealthResponse(q: string) {
  const recipes: Record<string,any> = {
    '失眠': { name: '百合莲子汤', ingredients: '百合30克，莲子30克，红枣10颗，冰糖适量', steps: '1. 百合、莲子洗净浸泡2小时\n2. 红枣洗净去核\n3. 所有材料放入锅中，加水煮沸\n4.转小火炖煮1小时，加冰糖调味', effect: '养心安神，改善失眠多梦', herbs: [{ name: '百合', description: '味甘微苦，性微寒。养阴润肺，清心安神。' }, { name: '莲子', description: '味甘涩，性平。补脾止泻，养心安神。' }] },
    '脾胃': { name: '山药薏米粥', ingredients: '山药100克，薏米50克，大米50克，红枣5颗', steps: '1. 薏米提前浸泡4小时\n2. 山药去皮切小块\n3. 大米、薏米、红枣放入锅中煮粥\n4. 煮至半熟时加入山药，继续煮至软烂', effect: '健脾益胃，补气养血', herbs: [{ name: '山药', description: '味甘，性平。补脾养胃，生津益肺。' }, { name: '薏米', description: '味甘淡，性凉。利水渗湿，健脾止泻。' }] },
    '气血': { name: '当归黄芪鸡汤', ingredients: '当归10克，黄芪30克，鸡肉500克，生姜3片', steps: '1. 鸡肉洗净切块焯水\n2. 当归、黄芪洗净\n3. 所有材料放入锅中，加水炖煮\n4.大火煮沸后转小火炖2小时', effect: '补气养血，改善面色苍白', herbs: [{ name: '当归', description: '味甘辛，性温。补血活血，调经止痛。' }, { name: '黄芪', description: '味甘，性微温。补气升阳，固表止汗。' }] },
    '疲劳': { name: '枸杞桂圆茶', ingredients: '枸杞15克，桂圆肉10克，红枣5颗，冰糖适量', steps: '1. 所有材料洗净\n2. 放入茶壶或杯中\n3. 用沸水冲泡\n4. 盖上盖子焖10分钟即可饮用', effect: '滋补肝肾，益气养血，缓解疲劳乏力', herbs: [{ name: '枸杞', description: '味甘，性平。滋补肝肾，益精明目。' }, { name: '桂圆', description: '味甘，性温。补益心脾，养血安神。' }] }
  }
  let matched = null; for (const k in recipes) { if (q.includes(k)) { matched = recipes[k]; break } }
  if (!matched) matched = recipes['疲劳']
  return { id: Date.now().toString(), type: 'assistant', content: '根据您描述的症状，我为您推荐以下食疗方子：', recipe: matched }
}
</script>

<style lang="scss" scoped>
/* ════════════════════════════════════════════
   智能管家 — iOS粉白毛玻璃风格
   ════════════════════════════════════════════ */

.ai-container { min-height: 100vh; background: #FFF0F5; padding-bottom: 120rpx; }

/* ── 导航栏 ── */
.nav-bar {
  height: 88rpx; background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
  display: flex; align-items: center; justify-content: center;
  padding-top: env(safe-area-inset-top);
  border-bottom: 1px solid rgba(255, 255, 255, 0.70);
}
.nav-title { font-size: 36rpx; font-weight: 600; color: #4A4A4A; letter-spacing: 4rpx; }

/* ── 主页 ── */
.main-page { min-height: 100vh; background: #FFF0F5; }
.main-content { padding: 48rpx 32rpx; }

.menu-card {
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  height: 160rpx; border-radius: 32rpx; margin-bottom: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 8rpx 24rpx rgba(255, 182, 193, 0.08);
  transition: transform 0.15s ease;
}
.menu-card:active { transform: scale(0.98); }

.menu-icon { font-size: 52rpx; margin-right: 20rpx; }
.menu-text { font-size: 34rpx; font-weight: 500; color: #4A4A4A; letter-spacing: 2rpx; }

/* ── 子页面 ── */
.sub-page { min-height: 100vh; background: #FFF0F5; }
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 60rpx 32rpx 24rpx;
  background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.70);
  .header-left, .header-right { width: 80rpx; }
  .back-icon { font-size: 40rpx; color: #4A4A4A; font-weight: 300; }
  .header-title { font-size: 36rpx; font-weight: 600; color: #4A4A4A; letter-spacing: 4rpx; }
}
.sub-scroll { height: calc(100vh - 220rpx); }
.sub-content { padding: 24rpx; padding-bottom: 180rpx; }

/* ── 日历 ── */
.owner-tabs {
  display: flex; background: rgba(255, 255, 255, 0.40); backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); border-radius: 48rpx; padding: 6rpx;
  margin-bottom: 24rpx; border: 1px solid rgba(255, 255, 255, 0.70);
}
.owner-tab {
  flex: 1; text-align: center; padding: 20rpx; border-radius: 48rpx;
  font-size: 28rpx; color: #8D8D8D; font-weight: 400; transition: all 0.2s ease;
  &.active { background: rgba(255, 255, 255, 0.70); color: #4A4A4A; font-weight: 500; box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.08); }
}

.dual-cal { display: flex; gap: 24rpx; margin-bottom: 24rpx; }
.dual-cal-plan { display: flex; gap: 16rpx; margin-bottom: 24rpx; }
.cal-col { flex: 1; }
.cal-col-plan { flex: 1; min-width: 0; }
.cal-owner-tag {
  text-align: center; padding: 14rpx; border-radius: 48rpx 48rpx 0 0;
  font-size: 26rpx; font-weight: 500;
  &.me { background: rgba(255, 182, 193, 0.22); color: #4A4A4A; }
  &.partner { background: rgba(255, 182, 193, 0.16); color: #4A4A4A; }
}

.cal-box {
  background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 0 0 28rpx 28rpx; padding: 20rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}

.cal-box-plan {
  background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 0 0 20rpx 20rpx; padding: 12rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}

.cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.month-nav {
  width: 56rpx; height: 56rpx; border-radius: 50%;
  background: rgba(255, 255, 255, 0.50);
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; color: #4A4A4A; font-weight: 300;
}
.cal-month { font-size: 28rpx; font-weight: 600; color: #4A4A4A; letter-spacing: 1px; }
.weekday-row { display: flex; padding: 12rpx 0; border-bottom: 1px solid rgba(255, 182, 193, 0.10); }
.weekday { flex: 1; text-align: center; font-size: 24rpx; color: #8D8D8D; font-weight: 400; }
.cal-grid { display: flex; flex-wrap: wrap; padding: 12rpx 0; }
.cal-day {
  width: calc(100% / 7); aspect-ratio: 1;
  display: flex; flex-direction: column; align-items: center;
  justify-content: flex-start; padding-top: 6rpx; position: relative;

  &.dim .day-num { color: #D0C0C5; }
  &.today .day-num {
    background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%);
    color: #fff; border-radius: 50%; width: 48rpx; height: 48rpx;
    display: flex; align-items: center; justify-content: center;
  }
  &.sel { background: rgba(255, 182, 193, 0.15); border-radius: 50%; }
}
.day-num { font-size: 26rpx; color: #4A4A4A; font-weight: 400; }
.dot { width: 6rpx; height: 6rpx; border-radius: 50%; margin-top: 4rpx;
  &.me { background: #FFB6C1; }
  &.partner { background: #FF99AA; }
}

/* ── 日历计划本 ── */
.cal-grid-plan {
  display: flex; flex-wrap: wrap; padding: 12rpx 0;
}
.cal-day-plan {
  width: calc(100% / 7); min-height: 120rpx;
  display: flex; flex-direction: column; align-items: center;
  padding: 8rpx 4rpx; position: relative;
  border: 1px solid rgba(255, 182, 193, 0.08);
  border-radius: 12rpx; margin: 2rpx;
  transition: background 0.15s ease;

  &.dim .day-num-plan { color: #D0C0C5; }
  &.today { background: rgba(255, 182, 193, 0.08); }
  &.sel { background: rgba(255, 182, 193, 0.18); border-color: rgba(255, 182, 193, 0.40); }
}
.day-num-plan {
  font-size: 24rpx; color: #4A4A4A; font-weight: 500;
  margin-bottom: 4rpx;
}
.cal-event-tag {
  width: 100%; padding: 4rpx 8rpx; border-radius: 8rpx;
  margin-bottom: 4rpx; overflow: hidden;
  &.me { background: rgba(255, 182, 193, 0.25); }
  &.partner { background: rgba(255, 153, 170, 0.20); }
}
.cal-event-text {
  font-size: 18rpx; color: #4A4A4A; font-weight: 400;
  display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cal-more-tag {
  font-size: 18rpx; color: #8D8D8D; font-weight: 400;
}

/* ── 空闲日期 ── */
.spare-card {
  background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 28rpx; padding: 24rpx; margin-bottom: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}
.section-label { font-size: 28rpx; font-weight: 500; color: #4A4A4A; display: block; margin-bottom: 16rpx; }
.spare-tags { display: flex; flex-wrap: wrap; gap: 12rpx; }
.spare-tag {
  background: rgba(255, 182, 193, 0.12); border-radius: 48rpx;
  padding: 12rpx 24rpx; font-size: 26rpx; color: #4A4A4A;
  border: 1px solid rgba(255, 255, 255, 0.65);
}
.spare-empty { width: 100%; text-align: center; padding: 16rpx; font-size: 26rpx; color: #B0A0A5; }

/* ── 添加按钮 ── */
.add-btn {
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%);
  color: #fff; height: 96rpx; border-radius: 48rpx; margin-bottom: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.50);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.20);
  transition: transform 0.15s ease;
}
.add-btn:active { transform: scale(0.97); }
.add-icon { font-size: 40rpx; font-weight: 300; margin-right: 8rpx; }
.add-text { font-size: 30rpx; font-weight: 500; letter-spacing: 2rpx; }

/* ── 日程列表 ── */
.event-list { margin-top: 24rpx; }
.event-item {
  display: flex; align-items: center;
  background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 24rpx; border-radius: 24rpx; margin-bottom: 16rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}
.event-time-cell { width: 80rpx; text-align: center; margin-right: 16rpx; flex-shrink: 0; }
.event-time-cell text { font-size: 24rpx; color: #C2787A; font-weight: 400; }
.event-info { flex: 1; }
.event-title { font-size: 28rpx; color: #4A4A4A; display: block; margin-bottom: 6rpx; font-weight: 500; }
.event-meta { font-size: 24rpx; color: #8D8D8D; }
.event-tag {
  padding: 8rpx 16rpx; border-radius: 48rpx; font-size: 22rpx; font-weight: 400; flex-shrink: 0;
  &.me { background: rgba(255, 182, 193, 0.12); color: #C2787A; }
  &.partner { background: rgba(255, 182, 193, 0.10); color: #B09095; }
}

/* ── 天气卡片 ── */
.weather-card {
  display: flex; align-items: center;
  background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 32rpx; border-radius: 28rpx; margin-bottom: 32rpx;
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}
.weather-icon { font-size: 72rpx; margin-right: 24rpx; }
.weather-temp { font-size: 48rpx; font-weight: 600; color: #4A4A4A; }
.weather-desc { font-size: 28rpx; color: #8D8D8D; margin-top: 6rpx; }

/* ── 空闲日期列表 ── */
.spare-section { margin-bottom: 32rpx; }
.spare-list { display: flex; flex-direction: column; gap: 16rpx; }
.spare-row {
  display: flex; align-items: center;
  background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 24rpx 32rpx; border-radius: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
  transition: transform 0.15s ease;
}
.spare-row:active { transform: scale(0.99); }
.spare-date { font-size: 30rpx; font-weight: 500; color: #4A4A4A; margin-right: 16rpx; }
.spare-wd { font-size: 26rpx; color: #8D8D8D; }
.best-tag {
  margin-left: auto; padding: 8rpx 16rpx; border-radius: 48rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%);
  font-size: 24rpx; color: #fff;
}

/* ── 建议卡片 ── */
.suggestion-section { margin-bottom: 32rpx; }
.sug-list { display: flex; flex-direction: column; gap: 20rpx; }
.sug-card {
  background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 28rpx; border-radius: 28rpx;
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}
.sug-header { display: flex; align-items: center; margin-bottom: 14rpx; }
.sug-icon { font-size: 40rpx; margin-right: 14rpx; }
.sug-title { font-size: 30rpx; font-weight: 600; color: #4A4A4A; }
.sug-desc { font-size: 26rpx; color: #8D8D8D; line-height: 1.6; margin-bottom: 14rpx; }
.sug-tags { display: flex; gap: 10rpx; margin-bottom: 20rpx; }
.sug-tag { padding: 8rpx 16rpx; background: rgba(255, 182, 193, 0.10); border-radius: 48rpx; font-size: 24rpx; color: #C2787A; }
.sug-action {
  display: flex; align-items: center; justify-content: center;
  padding: 16rpx 32rpx; background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%);
  border-radius: 48rpx; font-size: 28rpx; color: #fff; font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.50);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.15);
  transition: transform 0.15s ease;
}
.sug-action:active { transform: scale(0.96); }

/* ── 药膳聊天 ── */
.chat-box {
  background: rgba(255, 255, 255, 0.50); backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 28rpx; padding: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
  margin-bottom: 24rpx;
}
.chat-msgs { max-height: 55vh; overflow-y: auto; display: flex; flex-direction: column; gap: 20rpx; padding-bottom: 16rpx; }

.chat-msg {
  display: flex; align-items: flex-start; gap: 14rpx;
  &.user { flex-direction: row-reverse; justify-content: flex-start;
    .msg-body { background: rgba(255, 182, 193, 0.22); color: #4A4A4A; margin-left: auto; }
  }
  &.assistant {
    .msg-body { background: rgba(255, 255, 255, 0.55); color: #4A4A4A; }
  }
}
.msg-avatar {
  width: 56rpx; height: 56rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 26rpx; flex-shrink: 0;
  &.user { background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%); color: #fff; }
  &.asst { background: rgba(160, 200, 160, 0.20); }
}
.msg-body { max-width: 70%; padding: 20rpx 24rpx; border-radius: 24rpx; }
.msg-text { font-size: 28rpx; line-height: 1.6; }
.msg-imgs { display: flex; gap: 10rpx; margin-top: 12rpx; }
.msg-img { width: 120rpx; height: 120rpx; border-radius: 16rpx; }

.recipe-card { margin-top: 16rpx; padding: 20rpx; background: rgba(255, 255, 255, 0.50); border-radius: 20rpx; border: 1px solid rgba(255, 255, 255, 0.65); }
.rcp-title { font-size: 30rpx; font-weight: 600; color: #4A4A4A; margin-bottom: 14rpx; display: block; }
.rcp-row { margin-bottom: 10rpx; }
.rcp-label { font-size: 26rpx; font-weight: 500; color: #C2787A; }
.rcp-text { font-size: 26rpx; color: #4A4A4A; line-height: 1.6; }
.herb-list { margin-top: 14rpx; padding-top: 14rpx; border-top: 1px solid rgba(255, 182, 193, 0.12); }
.herb-info { padding: 14rpx; background: rgba(160, 200, 160, 0.10); border-radius: 14rpx; margin-bottom: 10rpx; }
.herb-name { font-size: 26rpx; font-weight: 600; color: #A0C8A0; display: block; margin-bottom: 4rpx; }
.herb-desc { font-size: 24rpx; color: #8D8D8D; line-height: 1.5; }

.chat-input-area { padding-top: 16rpx; border-top: 1px solid rgba(255, 182, 193, 0.12); }
.chat-input-row { display: flex; align-items: center; gap: 12rpx; }
.img-upload {
  width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.50); border-radius: 48rpx;
  border: 1px solid rgba(255, 255, 255, 0.65); font-size: 32rpx;
}
.chat-input {
  flex: 1; height: 72rpx; padding: 0 24rpx;
  background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 48rpx; font-size: 28rpx; color: #4A4A4A;
}
.send-btn {
  width: 110rpx; height: 72rpx; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%);
  border-radius: 48rpx; font-size: 26rpx; color: #fff; font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.50);
  transition: transform 0.15s ease;
}
.send-btn:active { transform: scale(0.95); }

.preview-row { display: flex; gap: 10rpx; margin-top: 14rpx; }
.preview-item { position: relative; }
.preview-img { width: 100rpx; height: 100rpx; border-radius: 16rpx; }
.remove-img {
  position: absolute; top: -8rpx; right: -8rpx; width: 32rpx; height: 32rpx;
  display: flex; align-items: center; justify-content: center;
  background: #E08890; border-radius: 50%; font-size: 22rpx; color: #fff;
}

.quick-box {
  background: rgba(255, 255, 255, 0.50); backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 24rpx; border-radius: 28rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}
.quick-title { font-size: 28rpx; font-weight: 500; color: #4A4A4A; display: block; margin-bottom: 16rpx; }
.quick-tags { display: flex; flex-wrap: wrap; gap: 12rpx; }
.quick-tag {
  padding: 14rpx 24rpx; background: rgba(255, 182, 193, 0.10);
  border-radius: 48rpx; font-size: 26rpx; color: #4A4A4A;
  border: 1px solid rgba(255, 255, 255, 0.60);
  transition: transform 0.15s ease;
}
.quick-tag:active { transform: scale(0.96); }

/* ── 弹窗 (共用) ── */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(194, 120, 122, 0.12); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: flex-end; z-index: 1000; }
.modal-sheet { width: 100%; max-height: 80vh; overflow-y: auto; background: rgba(255, 255, 255, 0.72); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 36rpx 36rpx 0 0; padding: 32rpx; padding-bottom: calc(32rpx + env(safe-area-inset-bottom)); border: 1px solid rgba(255, 255, 255, 0.85); border-bottom: none; box-shadow: 0 -4rpx 30rpx rgba(255, 182, 193, 0.12); }
.modal-title { font-size: 34rpx; font-weight: 600; color: #4A4A4A; display: block; text-align: center; margin-bottom: 32rpx; letter-spacing: 2rpx; }
.modal-body { margin-bottom: 32rpx; }

.form-group { margin-bottom: 24rpx; position: relative;
  &.row { display: flex; align-items: center; }
}
.form-label { font-size: 26rpx; color: #8D8D8D; display: block; margin-bottom: 12rpx; font-weight: 400; }

.glass-input { width: 100%; height: 96rpx; border: 1px solid rgba(255, 255, 255, 0.70); border-radius: 48rpx; padding: 0 32rpx; font-size: 28rpx; box-sizing: border-box; background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: #4A4A4A; font-weight: 400; }
.glass-picker { display: flex; justify-content: space-between; align-items: center; height: 96rpx; border: 1px solid rgba(255, 255, 255, 0.70); border-radius: 48rpx; padding: 0 32rpx; font-size: 28rpx; color: #4A4A4A; background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); cursor: pointer; }
.custom-dropdown {
  position: absolute; left: 32rpx; right: 32rpx; top: 100%;
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-radius: 24rpx; border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 8rpx 24rpx rgba(255, 182, 193, 0.15);
  z-index: 1001; overflow: hidden; margin-top: 8rpx;
}
.dropdown-item {
  padding: 24rpx 32rpx; font-size: 28rpx; color: #4A4A4A;
  border-bottom: 1px solid rgba(255, 255, 255, 0.60);
  transition: background 0.15s ease;
  &:last-child { border-bottom: none; }
  &.active { background: rgba(255, 182, 193, 0.18); color: #C2787A; font-weight: 500; }
  &:active { background: rgba(255, 182, 193, 0.12); }
}
.picker-arrow { font-size: 36rpx; color: #B0A0A5; font-weight: 300; }

.check-box { width: 44rpx; height: 44rpx; border: 1.5px solid rgba(194, 120, 122, 0.30); border-radius: 12rpx; display: inline-flex; align-items: center; justify-content: center; margin-right: 12rpx;
  &.checked { background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%); border-color: transparent; }
}
.check-icon { color: #fff; font-size: 24rpx; }
.check-label { font-size: 28rpx; color: #4A4A4A; }

.options-row { display: flex; gap: 16rpx; }
.opt-btn { flex: 1; text-align: center; padding: 20rpx; background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-radius: 48rpx; font-size: 26rpx; color: #8D8D8D; border: 1px solid rgba(255, 255, 255, 0.65); transition: all 0.2s ease;
  &.active { background: rgba(255, 182, 193, 0.18); border-color: rgba(255, 255, 255, 0.85); color: #4A4A4A; font-weight: 500; box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.10); }
}

.modal-actions { display: flex; gap: 24rpx; }
.btn-glass { flex: 1; height: 96rpx; font-size: 28rpx; border-radius: 48rpx; background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.70); color: #4A4A4A; font-weight: 400; box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06); }
.btn-accent { flex: 1; height: 96rpx; font-size: 28rpx; border-radius: 48rpx; background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%); color: #fff; border: 1px solid rgba(255, 255, 255, 0.50); box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.20); font-weight: 500; letter-spacing: 1px; transition: transform 0.15s ease;
  &:active { transform: scale(0.96); }
}

/* ── 日程详情 ── */
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.close-btn { width: 56rpx; height: 56rpx; display: flex; align-items: center; justify-content: center; background: rgba(194, 120, 122, 0.10); border-radius: 50%; font-size: 26rpx; color: #C2787A; }
.detail-list { display: flex; flex-direction: column; gap: 20rpx; }
.detail-item { display: flex; align-items: flex-start; padding: 20rpx; background: rgba(255, 255, 255, 0.45); border-radius: 20rpx; }
.detail-time { width: 80rpx; text-align: center; margin-right: 16rpx; font-size: 26rpx; color: #C2787A; }
.detail-info { flex: 1; }
.detail-title { font-size: 30rpx; color: #4A4A4A; display: block; margin-bottom: 10rpx; font-weight: 500; }
.detail-meta { display: flex; align-items: center; gap: 14rpx; }
.detail-tag { padding: 6rpx 14rpx; border-radius: 48rpx; font-size: 22rpx;
  &.me { background: rgba(255, 182, 193, 0.12); color: #C2787A; }
  &.partner { background: rgba(255, 182, 193, 0.10); color: #B09095; }
}
.detail-type { font-size: 24rpx; color: #8D8D8D; }
.detail-actions { display: flex; gap: 10rpx; flex-shrink: 0; }
.d-act { padding: 8rpx 18rpx; border-radius: 48rpx; font-size: 24rpx; background: rgba(255, 255, 255, 0.45); border: 1px solid rgba(255, 255, 255, 0.60); color: #4A4A4A;
  &.edit { background: rgba(160, 200, 160, 0.12); }
}
</style>
