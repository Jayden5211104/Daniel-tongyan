<template>
  <view class="home-container">
    <!-- 导航栏 (毛玻璃) -->
    <view class="nav-bar">
      <text class="nav-title">同檐</text>
      <text class="nav-subtitle">制作人：赵宇恒_Daniel</text>
    </view>

    <!-- 问候区 -->
    <view class="header-card">
      <view class="greeting">
        <text class="greeting-text">你好，{{ userStore.currentUserName }}</text>
        <text class="date-text">{{ currentDate }}</text>
      </view>
      <view class="partner-chip">
        <text class="chip-icon">💑</text>
        <text class="partner-name">{{ userStore.partnerName }}</text>
      </view>
    </view>

    <!-- 余额卡片 -->
    <view class="balance-card">
      <view class="balance-header">
        <text class="balance-label">家庭余额</text>
        <text class="balance-amount">¥{{ formatNumber(billStore.balance) }}</text>
      </view>
      <view class="balance-stats">
        <view class="stat-item">
          <text class="stat-value income">+¥{{ formatNumber(billStore.totalIncome) }}</text>
          <text class="stat-label">本月收入</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value expense">-¥{{ formatNumber(billStore.totalExpense) }}</text>
          <text class="stat-label">本月支出</text>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="action-item" @click="navigateTo('/pages/bill/index')">
        <view class="action-icon-bg bill">
          <text class="action-emoji">💰</text>
        </view>
        <text class="action-text">记账</text>
      </view>
      <view class="action-item" @click="navigateTo('/pages/emotion/index')">
        <view class="action-icon-bg emotion">
          <text class="action-emoji">💌</text>
        </view>
        <text class="action-text">留言</text>
      </view>
      <view class="action-item" @click="navigateTo('/pages/life/index')">
        <view class="action-icon-bg life">
          <text class="action-emoji">📋</text>
        </view>
        <text class="action-text">家务</text>
      </view>
      <view class="action-item" @click="navigateTo('/pages/ai/index')">
        <view class="action-icon-bg ai">
          <text class="action-emoji">🤖</text>
        </view>
        <text class="action-text">日程</text>
      </view>
    </view>

    <!-- 纪念日 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">纪念日提醒</text>
        <text class="section-more" @click="navigateTo('/pages/emotion/index')">查看全部</text>
      </view>
      <view v-if="upcomingAnniversaries.length > 0" class="anniversary-list">
        <view v-for="item in upcomingAnniversaries" :key="item.id" class="anniversary-item">
          <view class="anniversary-icon-bg">
            <text>{{ item.type === 'birthday' ? '🎂' : item.type === 'anniversary' ? '💍' : '🎉' }}</text>
          </view>
          <view class="anniversary-info">
            <text class="anniversary-name">{{ item.name }}</text>
            <text class="anniversary-date">{{ item.date }}</text>
          </view>
          <view class="anniversary-countdown">
            <text class="countdown-num">{{ item.daysLeft }}</text>
            <text class="countdown-unit">天</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">📅</text>
        <text class="empty-text">暂无纪念日，去添加一个吧</text>
      </view>
    </view>

    <!-- 伴侣留言 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">伴侣留言</text>
        <text class="section-more" @click="navigateTo('/pages/emotion/index')">查看全部</text>
      </view>
      <view v-if="partnerMessages.length > 0" class="message-list">
        <view v-for="msg in partnerMessages.slice(0, 2)" :key="msg.id" class="message-item">
          <view class="message-avatar">
            <text>💑</text>
          </view>
          <view class="message-content">
            <text class="message-sender">{{ msg.sender || '伴侣' }}</text>
            <text class="message-text">{{ msg.content }}</text>
            <text class="message-time">{{ formatMessageTime(msg.timestamp) }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">💝</text>
        <text class="empty-text">暂无伴侣留言</text>
      </view>
    </view>

    <!-- 今日日程 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">今日日程</text>
        <text class="section-more" @click="navigateTo('/pages/ai/index')">查看全部</text>
      </view>
      <view v-if="todayEvents.length > 0" class="event-list">
        <view v-for="event in todayEvents" :key="event.id" class="event-item">
          <view class="event-time-dot">
            <text class="time-text">{{ event.allDay ? '全天' : event.time }}</text>
          </view>
          <view class="event-content">
            <text class="event-title">{{ event.title }}{{ formatEventTime(event) }}</text>
            <text class="event-sub">{{ event.owner }} · {{ event.type === 'work' ? '工作' : event.type === 'personal' ? '个人' : '共享' }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">今日暂无日程安排</text>
      </view>
    </view>

    <TabBar current="/pages/index/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useBillStore } from '@/stores/bill'
import { useEmotionStore } from '@/stores/emotion'
import { useAIStore } from '@/stores/ai'
import { useLifeStore } from '@/stores/life'
import TabBar from '@/components/TabBar.vue'

const userStore = useUserStore()
const billStore = useBillStore()
const emotionStore = useEmotionStore()
const aiStore = useAIStore()
const lifeStore = useLifeStore()

const currentDate = ref('')

const upcomingAnniversaries = computed(() => emotionStore.upcomingAnniversaries)
const partnerMessages = computed(() => {
  return emotionStore.messages
    .filter(msg => msg.sender && msg.content)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3)
})
const todayEvents = computed(() => aiStore.todayEvents)

let pollTimer: ReturnType<typeof setInterval> | null = null

function refreshData() {
  billStore.loadData()
  emotionStore.loadData()
  aiStore.loadData()
  lifeStore.loadData()
}

onMounted(() => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }
  currentDate.value = now.toLocaleDateString('zh-CN', options)

  userStore.loadUserNames()
  refreshData()

  pollTimer = setInterval(() => {
    refreshData()
  }, 3000)
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

function formatEventTime(ev: any): string {
  if (ev.allDay) return '(全天)'
  const start = ev.startTime || ''
  const end = ev.endTime || ''
  if (start && end) return `(${start}~${end})`
  if (start) return `(${start})`
  return ''
}

function navigateTo(url: string) {
  uni.navigateTo({ url })
}

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return `${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
  background: #FFF0F5;
  padding-bottom: 120rpx;
}

/* ── 导航栏 ── */
.nav-bar {
  height: 100rpx;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: env(safe-area-inset-top);
  border-bottom: 1px solid rgba(255, 255, 255, 0.70);
}

.nav-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #4A4A4A;
  letter-spacing: 4rpx;
}

.nav-subtitle {
  font-size: 20rpx;
  color: #B0A0A5;
  margin-top: 4rpx;
  letter-spacing: 1rpx;
}

/* ── 问候区 ── */
.header-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 32rpx;
  margin: 24rpx;
  border-radius: 28rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.08);
}

.greeting-text {
  font-size: 36rpx;
  font-weight: 600;
  color: #4A4A4A;
  display: block;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.date-text {
  font-size: 26rpx;
  color: #8D8D8D;
  font-weight: 400;
}

.partner-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 182, 193, 0.12);
  padding: 16rpx 24rpx;
  border-radius: 48rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
}

.chip-icon {
  font-size: 36rpx;
}

.partner-name {
  font-size: 22rpx;
  color: #4A4A4A;
  margin-top: 6rpx;
  font-weight: 400;
}

/* ── 余额卡片 ── */
.balance-card {
  background: rgba(255, 255, 255, 0.60);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  margin: -12rpx 24rpx 24rpx;
  border-radius: 28rpx;
  padding: 32rpx;
  border: 1px solid rgba(255, 255, 255, 0.80);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.10);
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24rpx;
}

.balance-label {
  font-size: 26rpx;
  color: #8D8D8D;
  font-weight: 400;
}

.balance-amount {
  font-size: 52rpx;
  font-weight: 600;
  color: #4A4A4A;
  line-height: 1.3;
}

.balance-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 24rpx;
  border-top: 1px solid rgba(255, 182, 193, 0.12);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32rpx;
  font-weight: 500;
  display: block;
  margin-bottom: 6rpx;
  line-height: 1.4;

  &.income {
    color: #A0C8A0;
  }

  &.expense {
    color: #C2787A;
  }
}

.stat-label {
  font-size: 24rpx;
  color: #8D8D8D;
  font-weight: 400;
}

.stat-divider {
  width: 1rpx;
  background: rgba(255, 182, 193, 0.15);
}

/* ── 快捷操作 ── */
.quick-actions {
  display: flex;
  padding: 0 24rpx;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.action-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24rpx;
  padding: 24rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
  transition: transform 0.15s ease;
}

.action-item:active {
  transform: scale(0.96);
}

.action-icon-bg {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;

  &.bill { background: rgba(255, 182, 193, 0.18); }
  &.emotion { background: rgba(255, 182, 193, 0.14); }
  &.life { background: rgba(194, 120, 122, 0.10); }
  &.ai { background: rgba(255, 182, 193, 0.16); }
}

.action-emoji {
  font-size: 36rpx;
}

.action-text {
  font-size: 24rpx;
  color: #4A4A4A;
  font-weight: 400;
}

/* ── 区块卡片 ── */
.section-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  margin: 0 24rpx 24rpx;
  border-radius: 28rpx;
  padding: 28rpx;
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #4A4A4A;
  line-height: 1.5;
}

.section-more {
  font-size: 24rpx;
  color: #C2787A;
  font-weight: 400;
}

/* ── 纪念日 ── */
.anniversary-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.anniversary-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.65);
}

.anniversary-icon-bg {
  width: 64rpx;
  height: 64rpx;
  background: rgba(255, 182, 193, 0.12);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.anniversary-info {
  flex: 1;
}

.anniversary-name {
  font-size: 28rpx;
  color: #4A4A4A;
  display: block;
  margin-bottom: 4rpx;
  font-weight: 500;
  line-height: 1.5;
}

.anniversary-date {
  font-size: 24rpx;
  color: #8D8D8D;
  font-weight: 400;
}

.anniversary-countdown {
  text-align: center;
  min-width: 72rpx;
}

.countdown-num {
  font-size: 36rpx;
  font-weight: 500;
  color: #C2787A;
  display: block;
  line-height: 1.3;
}

.countdown-unit {
  font-size: 20rpx;
  color: #8D8D8D;
  font-weight: 400;
}

/* ── 留言 ── */
.message-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.message-item {
  display: flex;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.65);
}

.message-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.30) 0%, rgba(255, 153, 170, 0.25) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.70);

  text {
    font-size: 32rpx;
  }
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-sender {
  font-size: 26rpx;
  color: #C2787A;
  display: block;
  margin-bottom: 6rpx;
  font-weight: 500;
}

.message-text {
  font-size: 28rpx;
  color: #4A4A4A;
  display: block;
  margin-bottom: 6rpx;
  word-break: break-all;
  line-height: 1.5;
}

.message-time {
  font-size: 22rpx;
  color: #8D8D8D;
  font-weight: 400;
}

/* ── 日程 ── */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.event-item {
  display: flex;
  padding: 18rpx 20rpx;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.65);
}

.event-time-dot {
  width: 88rpx;
  text-align: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.time-text {
  font-size: 24rpx;
  color: #C2787A;
  font-weight: 400;
  line-height: 1.5;
}

.event-content {
  flex: 1;
}

.event-title {
  font-size: 28rpx;
  color: #4A4A4A;
  display: block;
  margin-bottom: 4rpx;
  font-weight: 500;
  line-height: 1.5;
}

.event-sub {
  font-size: 24rpx;
  color: #8D8D8D;
  font-weight: 400;
}

/* ── 空状态 ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
}

.empty-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 26rpx;
  color: #8D8D8D;
  font-weight: 400;
}
</style>
