<template>
  <view class="login-container">
    <!-- Logo -->
    <view class="logo-section">
      <view class="logo-ring">
        <view class="logo-inner">
          <text class="logo-icon">🏠</text>
        </view>
      </view>
      <text class="app-name">同檐</text>
      <text class="app-slogan">与你共享生活的每一刻</text>
    </view>

    <!-- 首次登录：设置暗号 -->
    <view v-if="isFirstLogin && !showJoinMode" class="form-card">
      <text class="form-title">设置双人暗号</text>
      <text class="form-desc">设置一个暗号，与你的伴侣共享这个秘密</text>
      <view class="input-group">
        <input
          v-model="cipher"
          type="text"
          placeholder="请输入暗号（6-12位）"
          class="glass-input"
          maxlength="12"
        />
      </view>
      <view class="input-group">
        <input
          v-model="confirmCipher"
          type="text"
          placeholder="请再次输入暗号"
          class="glass-input"
          maxlength="12"
        />
      </view>
      <view class="input-group">
        <input
          v-model="userName"
          type="text"
          placeholder="输入你的昵称"
          class="glass-input"
        />
      </view>
      <view class="input-group">
        <input
          v-model="partnerName"
          type="text"
          placeholder="输入伴侣的昵称"
          class="glass-input"
        />
      </view>
      <button @click="handleFirstLogin" class="btn-accent">
        开始共享
      </button>
      <view class="form-link">
        <text @click="showJoinMode = true" class="link-text">已有暗号？点击加入</text>
      </view>
    </view>

    <!-- 加入已有系统 -->
    <view v-else-if="showJoinMode" class="form-card">
      <text class="form-title">加入已有系统</text>
      <text class="form-desc">输入暗号并选择你的角色加入系统</text>
      <view class="input-group">
        <input
          v-model="joinCipher"
          type="text"
          placeholder="请输入暗号"
          class="glass-input"
          maxlength="12"
        />
      </view>
      <view class="role-section">
        <text class="role-label">选择你的角色</text>
        <view class="role-options">
          <view
            :class="['role-option', { active: joinRole === 'user' }]"
            @click="joinRole = 'user'"
          >
            <text>我</text>
          </view>
          <view
            :class="['role-option', { active: joinRole === 'partner' }]"
            @click="joinRole = 'partner'"
          >
            <text>伴侣</text>
          </view>
        </view>
      </view>
      <view class="input-group">
        <input
          v-model="joinUserName"
          type="text"
          placeholder="输入你的昵称"
          class="glass-input"
        />
      </view>
      <view class="input-group">
        <input
          v-model="joinPartnerName"
          type="text"
          placeholder="输入伴侣的昵称"
          class="glass-input"
        />
      </view>
      <button @click="handleJoin" class="btn-accent">
        加入系统
      </button>
      <view class="form-link">
        <text @click="showJoinMode = false" class="link-text">返回设置新暗号</text>
      </view>
    </view>

    <!-- 正常登录 -->
    <view v-else class="form-card">
      <text class="form-title">输入暗号进入</text>
      <text class="form-desc">输入你们的秘密暗号，继续共享生活</text>
      <view class="input-group">
        <input
          v-model="cipher"
          type="text"
          placeholder="请输入暗号"
          class="glass-input"
          maxlength="12"
        />
      </view>
      <view class="role-section">
        <text class="role-label">选择你的角色</text>
        <view class="role-options">
          <view
            :class="['role-option', { active: role === 'user' }]"
            @click="role = 'user'"
          >
            <text>{{ userStore.userName || '我' }}</text>
          </view>
          <view
            :class="['role-option', { active: role === 'partner' }]"
            @click="role = 'partner'"
          >
            <text>{{ userStore.partnerName || '伴侣' }}</text>
          </view>
        </view>
      </view>
      <button @click="handleLogin" class="btn-accent">
        进入同檐
      </button>
      <view class="form-link">
        <text @click="showResetModal = true" class="link-text subtle">忘记暗号？</text>
      </view>
    </view>

    <!-- 重置弹窗 -->
    <view v-if="showResetModal" class="modal-overlay" @click="showResetModal = false">
      <view class="modal-card" @click.stop>
        <text class="modal-title">重置暗号</text>
        <text class="modal-desc">重置暗号将清除所有数据，确定要继续吗？</text>
        <view class="modal-actions">
          <button @click="showResetModal = false" class="btn-glass">取消</button>
          <button @click="handleReset" class="btn-accent-sm">确定重置</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useBillStore } from '@/stores/bill'
import { useEmotionStore } from '@/stores/emotion'
import { useLifeStore } from '@/stores/life'
import { useAIStore } from '@/stores/ai'

const userStore = useUserStore()
const billStore = useBillStore()
const emotionStore = useEmotionStore()
const lifeStore = useLifeStore()
const aiStore = useAIStore()

const cipher = ref('')
const confirmCipher = ref('')
const userName = ref('')
const partnerName = ref('')
const isFirstLogin = ref(true)
const showResetModal = ref(false)
const role = ref<'user' | 'partner'>('user')
const showJoinMode = ref(false)
const joinCipher = ref('')
const joinRole = ref<'user' | 'partner'>('user')
const joinUserName = ref('')
const joinPartnerName = ref('')

onMounted(() => {
  userStore.loadCipher()
  userStore.loadUserNames()
  isFirstLogin.value = userStore.isFirstLogin
})

async function doLogin(secretCode: string, name: string, loginRole: 'user' | 'partner', successTitle: string, pName?: string) {
  try {
    const result = await userStore.login(secretCode, name, loginRole, pName)

    // Names are already set inside userStore.login(), no need to set again
    userStore.setCurrentRole(loginRole)

    billStore.loadData()
    emotionStore.loadData()
    lifeStore.loadData()
    aiStore.loadData()

    console.log('[Login] session:', { token: result.token, user_id: result.user_id, pair_id: result.pair_id })

    uni.showToast({ title: successTitle, icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/index/index' })
    }, 1500)
  } catch (e: any) {
    uni.showToast({ title: e.message || '登录失败', icon: 'none' })
  }
}

function handleFirstLogin() {
  if (!cipher.value || cipher.value.length < 6) {
    uni.showToast({ title: '暗号至少需要6位', icon: 'none' })
    return
  }
  if (cipher.value !== confirmCipher.value) {
    uni.showToast({ title: '两次输入的暗号不一致', icon: 'none' })
    return
  }
  if (!userName.value) {
    uni.showToast({ title: '请输入你的昵称', icon: 'none' })
    return
  }
  if (!partnerName.value) {
    uni.showToast({ title: '请输入伴侣的昵称', icon: 'none' })
    return
  }

  // Set partner name before login so store has it
  userStore.setUserNames(userName.value, partnerName.value)
  doLogin(cipher.value, userName.value, 'user', '设置成功', partnerName.value)
}

function handleJoin() {
  if (!joinCipher.value) {
    uni.showToast({ title: '请输入暗号', icon: 'none' })
    return
  }
  if (!joinUserName.value) {
    uni.showToast({ title: '请输入你的昵称', icon: 'none' })
    return
  }

  // Set names before login
  if (joinRole.value === 'user') {
    userStore.setUserNames(joinUserName.value, joinPartnerName.value || userStore.partnerName || '')
  } else {
    userStore.setUserNames(joinPartnerName.value || userStore.userName || '', joinUserName.value)
  }
  const pName = joinRole.value === 'user'
    ? (joinPartnerName.value || userStore.partnerName || '')
    : (joinPartnerName.value || userStore.userName || '')
  doLogin(joinCipher.value, joinUserName.value, joinRole.value, '加入成功', pName)
}

function handleLogin() {
  if (!cipher.value) {
    uni.showToast({ title: '请输入暗号', icon: 'none' })
    return
  }

  const loginName = role.value === 'user'
    ? (userStore.userName || '我')
    : (userStore.partnerName || '伴侣')

  // 传递伴侣名字（如果当前用户是"我"，伴侣就是 partnerName；如果当前用户是"伴侣"，伴侣就是 userName）
  const pName = role.value === 'user' ? userStore.partnerName : userStore.userName
  doLogin(cipher.value, loginName, role.value, `欢迎回来，${loginName}`, pName)
}

function handleReset() {
  userStore.clearAll()
  uni.removeStorageSync('billRecords')
  uni.removeStorageSync('billBudgets')
  uni.removeStorageSync('shoppingList')
  uni.removeStorageSync('dreamFunds')
  uni.removeStorageSync('emotionMessages')
  uni.removeStorageSync('emotionAnniversaries')
  uni.removeStorageSync('emotionAffirmations')
  uni.removeStorageSync('lifeChores')
  uni.removeStorageSync('lifeInventory')
  uni.removeStorageSync('lifeTravelPlans')
  uni.removeStorageSync('lifeRecipes')
  uni.removeStorageSync('aiCalendarEvents')
  uni.removeStorageSync('aiTasks')

  showResetModal.value = false
  isFirstLogin.value = true
  cipher.value = ''
  confirmCipher.value = ''
  userName.value = ''
  partnerName.value = ''

  uni.showToast({ title: '已重置', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: #FFF0F5;
  padding: 40rpx;
  box-sizing: border-box;
}

/* ── Logo ── */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100rpx;
  margin-bottom: 64rpx;
}

.logo-ring {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.40);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.80);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 182, 193, 0.12);
}

.logo-inner {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.30) 0%, rgba(255, 153, 170, 0.20) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  font-size: 56rpx;
}

.app-name {
  font-size: 52rpx;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 8rpx;
  letter-spacing: 4rpx;
}

.app-slogan {
  font-size: 26rpx;
  color: #8D8D8D;
  font-weight: 400;
}

/* ── 表单卡片 (毛玻璃) ── */
.form-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 8rpx 24rpx rgba(255, 182, 193, 0.08);
}

.form-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #4A4A4A;
  display: block;
  text-align: center;
  margin-bottom: 10rpx;
  letter-spacing: 1px;
}

.form-desc {
  font-size: 26rpx;
  color: #8D8D8D;
  display: block;
  text-align: center;
  margin-bottom: 40rpx;
  font-weight: 400;
  line-height: 1.5;
}

/* ── 毛玻璃输入框 ── */
.input-group {
  margin-bottom: 24rpx;
}

.glass-input {
  width: 100%;
  height: 96rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  border-radius: 48rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #4A4A4A;
  font-weight: 400;
  transition: border-color 0.2s ease;
}

.glass-input:focus {
  border-color: rgba(255, 182, 193, 0.60);
  outline: none;
}

/* ── 角色选择 ── */
.role-section {
  margin-bottom: 24rpx;
}

.role-label {
  font-size: 26rpx;
  color: #8D8D8D;
  display: block;
  margin-bottom: 16rpx;
  font-weight: 400;
}

.role-options {
  display: flex;
  gap: 20rpx;
}

.role-option {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.70);
  border-radius: 48rpx;
  font-size: 28rpx;
  color: #8D8D8D;
  font-weight: 400;
  transition: all 0.2s ease;

  &.active {
    background: linear-gradient(135deg, rgba(255, 182, 193, 0.25) 0%, rgba(255, 153, 170, 0.20) 100%);
    border-color: rgba(255, 255, 255, 0.90);
    color: #4A4A4A;
    font-weight: 500;
    box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.10);
  }
}

/* ── 主按钮 (渐变樱花粉) ── */
.btn-accent {
  width: 100%;
  height: 96rpx;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 16rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%);
  border-radius: 48rpx;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.50);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.20);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  letter-spacing: 2rpx;
}

.btn-accent:active {
  transform: scale(0.96);
}

.form-link {
  text-align: center;
  margin-top: 28rpx;
}

.link-text {
  font-size: 26rpx;
  color: #C2787A;
  font-weight: 400;

  &.subtle {
    color: #8D8D8D;
  }
}

/* ── 弹窗 ── */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(194, 120, 122, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  width: 600rpx;
  background: rgba(255, 255, 255, 0.70);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 32rpx;
  padding: 48rpx;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 12rpx 32rpx rgba(255, 182, 193, 0.14);
}

.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #4A4A4A;
  display: block;
  margin-bottom: 20rpx;
}

.modal-desc {
  font-size: 28rpx;
  color: #8D8D8D;
  display: block;
  margin-bottom: 40rpx;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 24rpx;

  button {
    flex: 1;
    height: 96rpx;
    font-size: 28rpx;
    border-radius: 48rpx;
    border: none;
    font-weight: 400;
  }
}

.btn-glass {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.70) !important;
  color: #4A4A4A;
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}

.btn-accent-sm {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%) !important;
  color: #fff !important;
  border: 1px solid rgba(255, 255, 255, 0.50) !important;
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.20);
}
</style>
