<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
/* ═══════════════════════════════════════════════════════════════
   同檐 — iOS 粉白毛玻璃设计系统 (Design Tokens)
   ═══════════════════════════════════════════════════════════════ */

page {
  /* 背景 — 极淡腮红粉 */
  background-color: #FFF0F5;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
}

/* ── 颜色令牌 ── */
:root {
  --color-bg: #FFF0F5;
  --color-surface: rgba(255, 255, 255, 0.65);
  --color-surface-hover: rgba(255, 255, 255, 0.80);
  --color-text-primary: #4A4A4A;
  --color-text-secondary: #8D8D8D;
  --color-text-tertiary: #B0A0A5;
  --color-accent-start: #FFB6C1;
  --color-accent-end: #FF99AA;
  --color-accent-light: rgba(255, 182, 193, 0.15);
  --color-accent-mid: rgba(255, 182, 193, 0.25);
  --color-rose: #C2787A;
  --color-rose-light: rgba(194, 120, 122, 0.12);
  --color-border: rgba(255, 255, 255, 0.70);
  --color-border-highlight: rgba(255, 255, 255, 0.90);
  --shadow-sm: 0 4rpx 12rpx rgba(255, 182, 193, 0.10);
  --shadow-md: 0 8rpx 24rpx rgba(255, 182, 193, 0.12);
  --shadow-lg: 0 12rpx 32rpx rgba(255, 182, 193, 0.14);
  --radius-sm: 16rpx;
  --radius-md: 24rpx;
  --radius-lg: 32rpx;
  --radius-full: 48rpx;
}

/* ── 全局容器 ── */
.container {
  padding: 24rpx;
}

/* ── 毛玻璃卡片 (Glass Morphism) ── */
.card {
  background: rgba(255, 255, 255, 0.60);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.10);
}

/* ── 主操作按钮 (渐变樱花粉胶囊) ── */
.btn-primary {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.50);
  border-radius: 48rpx;
  padding: 24rpx 48rpx;
  font-size: 28rpx;
  font-weight: 500;
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.20);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  letter-spacing: 0.5px;
}

.btn-primary:active {
  transform: scale(0.96);
  box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.15);
}

/* ── 次要按钮 (毛玻璃胶囊) ── */
.btn-secondary {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #4A4A4A;
  border: 1px solid rgba(255, 255, 255, 0.70);
  border-radius: 48rpx;
  padding: 24rpx 48rpx;
  font-size: 28rpx;
  font-weight: 400;
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
  transition: transform 0.15s ease;
}

.btn-secondary:active {
  transform: scale(0.96);
}

/* ── 排版辅助 ── */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-primary {
  color: #4A4A4A;
}

.text-secondary {
  color: #8D8D8D;
}

.text-sm {
  font-size: 24rpx;
  line-height: 1.5;
}

.text-md {
  font-size: 28rpx;
  line-height: 1.5;
}

.text-lg {
  font-size: 32rpx;
  line-height: 1.5;
}

.text-xl {
  font-size: 36rpx;
  line-height: 1.4;
}

.mt-24 { margin-top: 24rpx; }
.mt-32 { margin-top: 32rpx; }
.mb-24 { margin-bottom: 24rpx; }
</style>
