<template>
  <view class="emotion-container">
    <view class="nav-bar">
      <text class="nav-title">情感</text>
    </view>

    <view class="tabs-glass">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        <text class="tab-text">{{ tab.label }}</text>
      </view>
    </view>

    <!-- 留言板 -->
    <view v-if="activeTab === 'message'" class="content">
      <scroll-view class="message-list" scroll-y>
        <view v-if="emotionStore.messages.length > 0">
          <view
            v-for="msg in emotionStore.messages"
            :key="msg.id"
            :class="['message-item', { mine: msg.sender === userStore.currentUserName }]"
          >
            <view class="message-avatar">
              <text>{{ msg.sender === userStore.currentUserName ? '👤' : '👥' }}</text>
            </view>
            <view class="message-content">
              <text class="message-sender">{{ msg.sender }}</text>
              <view class="message-bubble">
                <text>{{ msg.content }}</text>
              </view>
              <text class="message-time">{{ formatTime(msg.timestamp) }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty-state">
          <text class="empty-icon">💬</text>
          <text class="empty-text">还没有留言，给TA说点什么吧</text>
        </view>
      </scroll-view>

      <view class="message-input-area">
        <input
          v-model="messageInput"
          type="text"
          placeholder="输入留言..."
          class="message-input"
          @confirm="sendMessage"
        />
        <button @click="sendMessage" class="send-btn">发送</button>
      </view>
    </view>

    <!-- 纪念日 -->
    <view v-if="activeTab === 'anniversary'" class="content">
      <view class="add-btn" @click="showAnniversaryModal = true">
        <text class="add-icon">+</text>
        <text class="add-text">添加纪念日</text>
      </view>

      <view v-if="emotionStore.anniversaries.length > 0" class="anniversary-list">
        <view v-for="item in sortedAnniversaries" :key="item.id" class="anniversary-item">
          <view class="anniversary-icon-bg">
            <text>{{ item.type === 'birthday' ? '🎂' : item.type === 'anniversary' ? '💍' : '🎉' }}</text>
          </view>
          <view class="anniversary-info">
            <text class="anniversary-name">{{ item.name }}</text>
            <text class="anniversary-date">{{ item.date }}</text>
            <view class="anniversary-days">
              <text :class="{ today: item.daysLeft === 0 }">
                {{ item.daysLeft === 0 ? '今天！' : item.daysLeft === 1 ? '明天' : `${item.daysLeft}天后` }}
              </text>
            </view>
          </view>
          <view class="anniversary-actions">
            <view class="action-btn edit" @click="editAnniversary(item)"><text>✏️</text></view>
            <view class="action-btn delete" @click="deleteAnniversary(item)"><text>🗑️</text></view>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">📅</text>
        <text class="empty-text">还没有纪念日</text>
      </view>
    </view>

    <!-- 爱的肯定 -->
    <view v-if="activeTab === 'affirmation'" class="content">
      <view class="add-btn" @click="showAffirmationModal = true">
        <text class="add-icon">+</text>
        <text class="add-text">发送爱的肯定</text>
      </view>

      <view v-if="emotionStore.affirmations.length > 0" class="affirmation-list">
        <view v-for="item in emotionStore.affirmations" :key="item.id" class="affirmation-item">
          <view class="affirmation-header">
            <text class="affirmation-giver">{{ item.giver }}</text>
            <text class="affirmation-arrow">→</text>
            <text class="affirmation-receiver">{{ item.receiver }}</text>
          </view>
          <view class="affirmation-content">
            <text>"{{ item.content }}"</text>
          </view>
          <text class="affirmation-time">{{ formatDate(item.timestamp) }}</text>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">💝</text>
        <text class="empty-text">还没有爱的肯定</text>
      </view>
    </view>

    <!-- 弹窗: 纪念日 -->
    <view v-if="showAnniversaryModal" class="modal-overlay" @click="showAnniversaryModal = false">
      <view class="modal-sheet" @click.stop>
        <text class="modal-title">{{ editingAnniversary ? '编辑纪念日' : '添加纪念日' }}</text>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">名称</text>
            <input v-model="anniversaryForm.name" type="text" placeholder="如：生日、纪念日" class="glass-input" />
          </view>
          <view class="form-group">
            <text class="form-label">日期</text>
            <picker mode="date" :value="anniversaryForm.date" @change="onDateChange">
              <view class="glass-picker">
                <text>{{ anniversaryForm.date || '选择日期' }}</text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">类型</text>
            <view class="type-options">
              <view
                v-for="type in anniversaryTypes"
                :key="type.value"
                :class="['type-option', { active: anniversaryForm.type === type.value }]"
                @click="anniversaryForm.type = type.value"
              >
                <text>{{ type.icon }} {{ type.label }}</text>
              </view>
            </view>
          </view>
          <view class="form-group row">
            <view :class="['check-box', { checked: anniversaryForm.year }]" @click="anniversaryForm.year = !anniversaryForm.year">
              <text v-if="anniversaryForm.year" class="check-icon">✓</text>
            </view>
            <text class="check-label">每年重复</text>
          </view>
        </view>
        <view class="modal-actions">
          <button @click="showAnniversaryModal = false" class="btn-glass">取消</button>
          <button @click="addAnniversary" class="btn-accent">保存</button>
        </view>
      </view>
    </view>

    <!-- 弹窗: 爱的肯定 -->
    <view v-if="showAffirmationModal" class="modal-overlay" @click="showAffirmationModal = false">
      <view class="modal-sheet" @click.stop>
        <text class="modal-title">发送爱的肯定</text>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">选择接收人</text>
            <view class="receiver-options">
              <view
                v-for="name in receivers"
                :key="name"
                :class="['receiver-option', { active: affirmationForm.receiver === name }]"
                @click="affirmationForm.receiver = name"
              >
                <text>{{ name }}</text>
              </view>
            </view>
          </view>
          <view class="form-group">
            <text class="form-label">留言内容</text>
            <textarea
              v-model="affirmationForm.content"
              placeholder="写下你想说的话..."
              class="glass-textarea"
              :maxlength="200"
            ></textarea>
            <text class="textarea-count">{{ affirmationForm.content.length }}/200</text>
          </view>
        </view>
        <view class="modal-actions">
          <button @click="showAffirmationModal = false" class="btn-glass">取消</button>
          <button @click="addAffirmation" class="btn-accent">发送</button>
        </view>
      </view>
    </view>

    <TabBar current="/pages/emotion/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useEmotionStore } from '@/stores/emotion'
import { useUserStore } from '@/stores/user'
import TabBar from '@/components/TabBar.vue'

const emotionStore = useEmotionStore()
const userStore = useUserStore()

const tabs = [
  { key: 'message', label: '留言板' },
  { key: 'anniversary', label: '纪念日' },
  { key: 'affirmation', label: '爱的肯定' }
]

const anniversaryTypes = [
  { value: 'birthday', label: '生日', icon: '🎂' },
  { value: 'anniversary', label: '纪念日', icon: '💍' },
  { value: 'other', label: '其他', icon: '🎉' }
]

const activeTab = ref('message')
const messageInput = ref('')

const showAnniversaryModal = ref(false)
const showAffirmationModal = ref(false)

const anniversaryForm = reactive({ name: '', date: '', type: 'birthday' as string, year: true })
const editingAnniversary = ref<any>(null)

const affirmationForm = reactive({ receiver: '', content: '' })

const receivers = computed(() => [userStore.userName, userStore.partnerName].filter(Boolean))

const sortedAnniversaries = computed(() => {
  const now = new Date()
  return emotionStore.anniversaries
    .map(a => {
      const date = new Date(a.date)
      let nextDate = new Date(date)
      nextDate.setFullYear(now.getFullYear())
      if (nextDate < now && !a.year) { nextDate.setFullYear(now.getFullYear() + 1) }
      else if (nextDate < now && a.year) { nextDate.setFullYear(now.getFullYear() + 1) }
      const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { ...a, daysLeft: diffDays }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
})

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  emotionStore.loadData(); userStore.loadUserNames()
  pollTimer = setInterval(() => { emotionStore.loadData() }, 3000)
})
onUnmounted(() => { if (pollTimer) { clearInterval(pollTimer); pollTimer = null } })

function formatTime(ts: string) { const d = new Date(ts); return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }
function formatDate(ts: string) { const d = new Date(ts); return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) }
function onDateChange(e: any) { anniversaryForm.date = e.detail.value }

function sendMessage() {
  if (!messageInput.value.trim()) { uni.showToast({ title: '请输入内容', icon: 'none' }); return }
  emotionStore.addMessage({ content: messageInput.value, sender: userStore.currentUserName, type: 'text' })
  messageInput.value = ''
}

function addAnniversary() {
  if (!anniversaryForm.name) { uni.showToast({ title: '请输入名称', icon: 'none' }); return }
  if (!anniversaryForm.date) { uni.showToast({ title: '请选择日期', icon: 'none' }); return }
  if (editingAnniversary.value) {
    emotionStore.updateAnniversary({ id: editingAnniversary.value.id, name: anniversaryForm.name, date: anniversaryForm.date, type: anniversaryForm.type as any, year: anniversaryForm.year })
    uni.showToast({ title: '修改成功', icon: 'success' })
  } else {
    emotionStore.addAnniversary({ name: anniversaryForm.name, date: anniversaryForm.date, type: anniversaryForm.type as any, year: anniversaryForm.year })
    uni.showToast({ title: '添加成功', icon: 'success' })
  }
  showAnniversaryModal.value = false
  anniversaryForm.name = ''; anniversaryForm.date = ''; anniversaryForm.type = 'birthday'; anniversaryForm.year = true
  editingAnniversary.value = null
}

function editAnniversary(item: any) {
  editingAnniversary.value = item
  anniversaryForm.name = item.name; anniversaryForm.date = item.date; anniversaryForm.type = item.type; anniversaryForm.year = item.year
  showAnniversaryModal.value = true
}

function deleteAnniversary(item: any) {
  uni.showModal({ title: '确认删除', content: `确定要删除"${item.name}"吗？`, success: (res) => { if (res.confirm) { emotionStore.deleteAnniversary(item.id); uni.showToast({ title: '删除成功', icon: 'success' }) } } })
}

function addAffirmation() {
  if (!affirmationForm.receiver) { uni.showToast({ title: '请选择接收人', icon: 'none' }); return }
  if (!affirmationForm.content.trim()) { uni.showToast({ title: '请输入内容', icon: 'none' }); return }
  emotionStore.addAffirmation({ content: affirmationForm.content, giver: userStore.currentUserName, receiver: affirmationForm.receiver })
  showAffirmationModal.value = false; affirmationForm.receiver = ''; affirmationForm.content = ''
  uni.showToast({ title: '发送成功', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.emotion-container {
  min-height: 100vh;
  background: #FFF0F5;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  height: 88rpx;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  display: flex; align-items: center; justify-content: center;
  padding-top: env(safe-area-inset-top);
  border-bottom: 1px solid rgba(255, 255, 255, 0.70);
}

.nav-title { font-size: 36rpx; font-weight: 600; color: #4A4A4A; letter-spacing: 4rpx; }

/* ── Tabs ── */
.tabs-glass {
  display: flex; margin: 20rpx 24rpx; padding: 6rpx;
  background: rgba(255, 255, 255, 0.40);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 48rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
}

.tab-item {
  flex: 1; padding: 24rpx 0; text-align: center; border-radius: 48rpx;
  transition: all 0.2s ease;

  &.active {
    background: rgba(255, 255, 255, 0.70);
    box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.08);
    .tab-text { color: #4A4A4A; font-weight: 500; }
  }
}

.tab-text { font-size: 26rpx; color: #8D8D8D; font-weight: 400; }

/* ── Content ── */
.content {
  flex: 1; display: flex; flex-direction: column;
  padding: 0 24rpx; padding-bottom: 120rpx;
}

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

/* ── 留言板 ── */
.message-list { flex: 1; margin-bottom: 24rpx; }

.message-item {
  display: flex; margin-bottom: 24rpx;

  &.mine {
    flex-direction: row-reverse;
    .message-content { align-items: flex-end; }
    .message-bubble {
      background: linear-gradient(135deg, rgba(255, 182, 193, 0.30) 0%, rgba(255, 153, 170, 0.25) 100%);
      color: #4A4A4A;
      border-radius: 24rpx 4rpx 24rpx 24rpx;
    }
  }
}

.message-avatar {
  width: 72rpx; height: 72rpx;
  background: rgba(255, 182, 193, 0.12);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.70);
}

.message-content {
  display: flex; flex-direction: column;
  margin: 0 16rpx; max-width: 70%;
}

.message-sender { font-size: 22rpx; color: #8D8D8D; margin-bottom: 8rpx; font-weight: 400; }

.message-bubble {
  background: rgba(255, 255, 255, 0.60);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 20rpx 24rpx;
  border-radius: 4rpx 24rpx 24rpx 24rpx;
  font-size: 28rpx; color: #4A4A4A;
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.06);
  line-height: 1.5;
}

.message-time { font-size: 20rpx; color: #B0A0A5; margin-top: 8rpx; }

.message-input-area {
  display: flex; gap: 16rpx; padding: 16rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 28rpx;
  border: 1px solid rgba(255, 255, 255, 0.75);
}

.message-input {
  flex: 1; height: 88rpx;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.70);
  border-radius: 48rpx; padding: 0 28rpx;
  font-size: 28rpx; color: #4A4A4A;
}

.send-btn {
  width: 120rpx; height: 88rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%);
  color: #fff; border-radius: 48rpx; font-size: 28rpx; font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.50);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.15);
  transition: transform 0.15s ease;
}
.send-btn:active { transform: scale(0.95); }

/* ── 纪念日列表 ── */
.anniversary-list { display: flex; flex-direction: column; gap: 16rpx; }

.anniversary-item {
  display: flex; align-items: center;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 24rpx; border-radius: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}

.anniversary-icon-bg {
  width: 72rpx; height: 72rpx;
  background: rgba(255, 182, 193, 0.12);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; margin-right: 20rpx; flex-shrink: 0;
}

.anniversary-info { flex: 1; }
.anniversary-name { font-size: 28rpx; color: #4A4A4A; font-weight: 500; display: block; margin-bottom: 6rpx; }
.anniversary-date { font-size: 24rpx; color: #8D8D8D; display: block; margin-bottom: 6rpx; }
.anniversary-days text {
  font-size: 24rpx; color: #C2787A; font-weight: 400;
  &.today { font-weight: 600; }
}

.anniversary-actions { display: flex; gap: 12rpx; }
.action-btn {
  width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center;
  border-radius: 48rpx; font-size: 28rpx;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.65);
  &.edit { background: rgba(160, 200, 160, 0.12); }
}

/* ── 爱的肯定 ── */
.affirmation-list { display: flex; flex-direction: column; gap: 20rpx; }

.affirmation-item {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 28rpx; border-radius: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}

.affirmation-header {
  display: flex; align-items: center; justify-content: center; margin-bottom: 16rpx;
}
.affirmation-giver, .affirmation-receiver { font-size: 28rpx; color: #4A4A4A; font-weight: 500; }
.affirmation-arrow { font-size: 24rpx; color: #C2787A; margin: 0 12rpx; }

.affirmation-content {
  text-align: center; padding: 20rpx;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 20rpx; margin-bottom: 12rpx;
  border: 1px solid rgba(255, 255, 255, 0.60);

  text { font-size: 30rpx; color: #4A4A4A; line-height: 1.6; font-weight: 400; }
}

.affirmation-time { font-size: 24rpx; color: #8D8D8D; display: block; text-align: center; }

/* ── 空状态 ── */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0; }
.empty-icon { font-size: 64rpx; margin-bottom: 16rpx; opacity: 0.6; }
.empty-text { font-size: 26rpx; color: #8D8D8D; font-weight: 400; }

/* ── 弹窗 ── */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(194, 120, 122, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: flex-end; z-index: 1000;
}

.modal-sheet {
  width: 100%;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 36rpx 36rpx 0 0;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-bottom: none;
  box-shadow: 0 -4rpx 30rpx rgba(255, 182, 193, 0.12);
}

.modal-title { font-size: 34rpx; font-weight: 600; color: #4A4A4A; display: block; text-align: center; margin-bottom: 32rpx; letter-spacing: 2rpx; }
.modal-body { margin-bottom: 32rpx; }

/* ── 表单 ── */
.form-group { margin-bottom: 24rpx;
  &.row { display: flex; align-items: center; }
}
.form-label { font-size: 26rpx; color: #8D8D8D; display: block; margin-bottom: 12rpx; font-weight: 400; }

.glass-input {
  width: 100%; height: 96rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  border-radius: 48rpx; padding: 0 32rpx;
  font-size: 28rpx; box-sizing: border-box;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #4A4A4A; font-weight: 400;
}

.glass-picker {
  display: flex; justify-content: space-between; align-items: center;
  height: 96rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  border-radius: 48rpx; padding: 0 32rpx;
  font-size: 28rpx; color: #4A4A4A;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.picker-arrow { font-size: 36rpx; color: #B0A0A5; font-weight: 300; }

.glass-textarea {
  width: 100%; height: 200rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  border-radius: 24rpx; padding: 20rpx;
  font-size: 28rpx; box-sizing: border-box;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #4A4A4A;
}

.textarea-count { font-size: 24rpx; color: #B0A0A5; float: right; margin-top: 8rpx; }

.type-options, .receiver-options { display: flex; gap: 16rpx; }

.type-option, .receiver-option {
  flex: 1; text-align: center; padding: 20rpx;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 48rpx; font-size: 26rpx; color: #8D8D8D;
  border: 1px solid rgba(255, 255, 255, 0.65);
  transition: all 0.2s ease;

  &.active {
    background: linear-gradient(135deg, rgba(255, 182, 193, 0.25) 0%, rgba(255, 153, 170, 0.20) 100%);
    border-color: rgba(255, 255, 255, 0.85);
    color: #4A4A4A; font-weight: 500;
    box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.10);
  }
}

.check-box {
  width: 44rpx; height: 44rpx;
  border: 1.5px solid rgba(194, 120, 122, 0.30);
  border-radius: 12rpx;
  display: inline-flex; align-items: center; justify-content: center;
  margin-right: 12rpx;

  &.checked {
    background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%);
    border-color: transparent;
  }
}
.check-icon { color: #fff; font-size: 24rpx; }
.check-label { font-size: 28rpx; color: #4A4A4A; }

/* ── 弹窗按钮 ── */
.modal-actions { display: flex; gap: 24rpx; }
.btn-glass {
  flex: 1; height: 96rpx; font-size: 28rpx; border-radius: 48rpx;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.70);
  color: #4A4A4A; font-weight: 400;
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}

.btn-accent {
  flex: 1; height: 96rpx; font-size: 28rpx; border-radius: 48rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%);
  color: #fff; border: 1px solid rgba(255, 255, 255, 0.50);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.20);
  font-weight: 500; letter-spacing: 1px;
  transition: transform 0.15s ease;
}
.btn-accent:active { transform: scale(0.96); }
</style>
