<template>
  <view class="custom-tabbar">
    <view
      v-for="item in tabList"
      :key="item.path"
      :class="['tab-item', { active: currentPath === item.path }]"
      @click="switchTab(item.path)"
    >
      <text class="tab-icon">{{ item.icon }}</text>
      <text class="tab-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  current: string
}>()

const tabList = [
  { path: '/pages/index/index', text: '首页', icon: '🏠' },
  { path: '/pages/bill/index', text: '账单', icon: '💰' },
  { path: '/pages/emotion/index', text: '情感', icon: '💑' },
  { path: '/pages/life/index', text: '生活', icon: '🏡' },
  { path: '/pages/ai/index', text: '智能', icon: '🤖' }
]

const currentPath = ref(props.current)

onMounted(() => {
  currentPath.value = props.current
})

function switchTab(path: string) {
  if (currentPath.value === path) return
  currentPath.value = path
  uni.navigateTo({ url: path })
}
</script>

<style lang="scss" scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 -2rpx 12rpx rgba(255, 182, 193, 0.08);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 999;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rpx 0;
  transition: transform 0.15s ease;

  &.active {
    .tab-icon {
      transform: scale(1.05);
    }

    .tab-text {
      color: #C2787A;
      font-weight: 500;
    }
  }
}

.tab-icon {
  font-size: 36rpx;
  margin-bottom: 4rpx;
  transition: transform 0.15s ease;
}

.tab-text {
  font-size: 20rpx;
  color: #8D8D8D;
  font-weight: 400;
  transition: color 0.15s ease;
}
</style>
