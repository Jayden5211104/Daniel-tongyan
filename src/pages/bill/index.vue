<template>
  <view class="bill-container">
    <view class="nav-bar">
      <text class="nav-title">账单</text>
    </view>

    <!-- Tab 切换 -->
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

    <!-- 记账记录 -->
    <view v-if="activeTab === 'records'" class="content">
      <view class="add-btn" @click="showAddModal = true">
        <text class="add-icon">+</text>
        <text class="add-text">记一笔</text>
      </view>

      <view v-if="billStore.records.length > 0" class="record-list">
        <view v-for="record in billStore.records" :key="record.id" class="record-item">
          <view class="record-icon" :class="record.type">
            <text>{{ getCategoryIcon(record.category) }}</text>
          </view>
          <view class="record-info">
            <text class="record-category">{{ record.category }}</text>
            <text class="record-desc">{{ record.description }}</text>
          </view>
          <view class="record-right">
            <text class="record-amount" :class="record.type">
              {{ record.type === 'income' ? '+' : '-' }}¥{{ formatNumber(record.amount) }}
            </text>
            <text class="record-payer">{{ record.payer }}支付</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">💰</text>
        <text class="empty-text">还没有记账记录</text>
      </view>
    </view>

    <!-- 预算 -->
    <view v-if="activeTab === 'budget'" class="content">
      <view class="add-btn" @click="showBudgetModal = true">
        <text class="add-icon">+</text>
        <text class="add-text">添加预算</text>
      </view>

      <view v-if="billStore.budgets.length > 0" class="budget-list">
        <view v-for="budget in billStore.budgets" :key="budget.category" class="budget-item">
          <view class="budget-header">
            <text class="budget-category">{{ budget.category }}</text>
            <text class="budget-amount">¥{{ formatNumber(budget.spent) }} / ¥{{ formatNumber(budget.limit) }}</text>
          </view>
          <view class="budget-progress">
            <view
              class="progress-bar"
              :class="{ warning: budget.spent / budget.limit > 0.8, danger: budget.spent >= budget.limit }"
              :style="{ width: Math.min(100, (budget.spent / budget.limit) * 100) + '%' }"
            ></view>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">📊</text>
        <text class="empty-text">还没有设置预算</text>
      </view>
    </view>

    <!-- 购物清单 -->
    <view v-if="activeTab === 'shopping'" class="content">
      <view class="add-btn" @click="showShoppingModal = true">
        <text class="add-icon">+</text>
        <text class="add-text">添加商品</text>
      </view>

      <view v-if="billStore.shoppingList.length > 0" class="shopping-list">
        <view
          v-for="item in billStore.shoppingList"
          :key="item.id"
          :class="['shopping-item', { checked: item.checked }]"
          @click="billStore.toggleShoppingItem(item.id)"
        >
          <view class="shopping-checkbox" :class="{ checked: item.checked }">
            <text v-if="item.checked" class="check-icon">✓</text>
          </view>
          <view class="shopping-info">
            <text class="shopping-name">{{ item.name }}</text>
            <text class="shopping-quantity">x{{ item.quantity }}</text>
          </view>
          <text class="shopping-added">由{{ item.addedBy }}添加</text>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">🛒</text>
        <text class="empty-text">购物清单是空的</text>
      </view>
    </view>

    <!-- 梦想基金 -->
    <view v-if="activeTab === 'dream'" class="content">
      <view class="add-btn" @click="showDreamModal = true">
        <text class="add-icon">+</text>
        <text class="add-text">添加梦想基金</text>
      </view>

      <view v-if="billStore.dreamFunds.length > 0" class="dream-list">
        <view v-for="fund in billStore.dreamFunds" :key="fund.id" class="dream-item">
          <view class="dream-icon-circle">{{ fund.icon }}</view>
          <view class="dream-info">
            <text class="dream-name">{{ fund.name }}</text>
            <view class="dream-progress">
              <view
                class="progress-fill"
                :style="{ width: Math.min(100, (fund.current / fund.target) * 100) + '%' }"
              ></view>
            </view>
            <text class="dream-amount">¥{{ formatNumber(fund.current) }} / ¥{{ formatNumber(fund.target) }}</text>
          </view>
          <view class="dream-add-btn" @click.stop="addToDream(fund)">
            <text class="dream-add-text">攒一笔</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">💭</text>
        <text class="empty-text">还没有梦想基金</text>
      </view>
    </view>

    <!-- Modals (matching the new design system) -->
    <view v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <view class="modal-sheet" @click.stop>
        <text class="modal-title">记一笔</text>
        <view class="modal-body">
          <view class="type-tabs">
            <view :class="['type-tab', { active: addForm.type === 'income' }]" @click="addForm.type = 'income'">收入</view>
            <view :class="['type-tab', { active: addForm.type === 'expense' }]" @click="addForm.type = 'expense'">支出</view>
          </view>
          <view class="form-group">
            <text class="form-label">金额</text>
            <input v-model="addForm.amount" type="digit" placeholder="0.00" class="glass-input" />
          </view>
          <view class="form-group">
            <text class="form-label">分类</text>
            <view class="glass-picker" @click="openDropdown('billCat')">
              <text>{{ addForm.category || '请选择分类' }}</text>
              <text class="picker-arrow">›</text>
            </view>
            <view v-if="openDropdownName === 'billCat'" class="custom-dropdown">
              <view v-for="(cat, idx) in categories" :key="idx" :class="['dropdown-item', { active: addForm.category === cat }]" @click="selectBillCat(cat)">
                <text>{{ cat }}</text>
              </view>
            </view>
          </view>
          <view class="form-group">
            <text class="form-label">备注</text>
            <input v-model="addForm.description" type="text" placeholder="添加备注" class="glass-input" />
          </view>
          <view class="form-group">
            <text class="form-label">支付人</text>
            <view class="glass-picker" @click="openDropdown('payer')">
              <text>{{ addForm.payer || '请选择支付人' }}</text>
              <text class="picker-arrow">›</text>
            </view>
            <view v-if="openDropdownName === 'payer'" class="custom-dropdown">
              <view v-for="(p, idx) in payers" :key="idx" :class="['dropdown-item', { active: addForm.payer === p }]" @click="selectPayer(p)">
                <text>{{ p }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="modal-actions">
          <button @click="showAddModal = false" class="btn-glass">取消</button>
          <button @click="addRecord" class="btn-accent">保存</button>
        </view>
      </view>
    </view>

    <view v-if="showBudgetModal" class="modal-overlay" @click="showBudgetModal = false">
      <view class="modal-sheet" @click.stop>
        <text class="modal-title">添加预算</text>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">分类</text>
            <input v-model="budgetForm.category" type="text" placeholder="如：餐饮、娱乐" class="glass-input" />
          </view>
          <view class="form-group">
            <text class="form-label">预算金额</text>
            <input v-model="budgetForm.limit" type="digit" placeholder="0.00" class="glass-input" />
          </view>
        </view>
        <view class="modal-actions">
          <button @click="showBudgetModal = false" class="btn-glass">取消</button>
          <button @click="addBudget" class="btn-accent">保存</button>
        </view>
      </view>
    </view>

    <view v-if="showShoppingModal" class="modal-overlay" @click="showShoppingModal = false">
      <view class="modal-sheet" @click.stop>
        <text class="modal-title">添加商品</text>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">商品名称</text>
            <input v-model="shoppingForm.name" type="text" placeholder="如：牛奶、面包" class="glass-input" />
          </view>
          <view class="form-group">
            <text class="form-label">数量</text>
            <input v-model="shoppingForm.quantity" type="number" placeholder="1" class="glass-input" />
          </view>
        </view>
        <view class="modal-actions">
          <button @click="showShoppingModal = false" class="btn-glass">取消</button>
          <button @click="addShoppingItem" class="btn-accent">保存</button>
        </view>
      </view>
    </view>

    <view v-if="showDreamModal" class="modal-overlay" @click="showDreamModal = false">
      <view class="modal-sheet" @click.stop>
        <text class="modal-title">添加梦想基金</text>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">梦想名称</text>
            <input v-model="dreamForm.name" type="text" placeholder="如：北欧旅行" class="glass-input" />
          </view>
          <view class="form-group">
            <text class="form-label">目标金额</text>
            <input v-model="dreamForm.target" type="digit" placeholder="0.00" class="glass-input" />
          </view>
          <view class="form-group">
            <text class="form-label">选择图标</text>
            <view class="icon-picker">
              <view
                v-for="icon in dreamIcons"
                :key="icon"
                :class="['icon-option', { selected: dreamForm.icon === icon }]"
                @click="dreamForm.icon = icon"
              >
                <text>{{ icon }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="modal-actions">
          <button @click="showDreamModal = false" class="btn-glass">取消</button>
          <button @click="addDreamFund" class="btn-accent">保存</button>
        </view>
      </view>
    </view>

    <view v-if="showAddToDreamModal" class="modal-overlay" @click="showAddToDreamModal = false">
      <view class="modal-sheet" @click.stop>
        <text class="modal-title">攒一笔</text>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">金额</text>
            <input v-model="addToDreamAmount" type="digit" placeholder="0.00" class="glass-input" />
          </view>
        </view>
        <view class="modal-actions">
          <button @click="showAddToDreamModal = false" class="btn-glass">取消</button>
          <button @click="confirmAddToDream" class="btn-accent">保存</button>
        </view>
      </view>
    </view>

    <TabBar current="/pages/bill/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useBillStore } from '@/stores/bill'
import { useUserStore } from '@/stores/user'
import TabBar from '@/components/TabBar.vue'

const billStore = useBillStore()
const userStore = useUserStore()

const tabs = [
  { key: 'records', label: '记账' },
  { key: 'budget', label: '预算' },
  { key: 'shopping', label: '购物清单' },
  { key: 'dream', label: '梦想基金' }
]

const categories = ['餐饮', '娱乐', '交通', '购物', '医疗', '教育', '工资', '奖金', '其他']
const dreamIcons = ['✈️', '🏠', '💍', '🚗', '📚', '🎁', '🏝️', '🎸']

const activeTab = ref('records')

const showAddModal = ref(false)
const showBudgetModal = ref(false)
const showShoppingModal = ref(false)
const showDreamModal = ref(false)
const showAddToDreamModal = ref(false)

const addForm = reactive({
  type: 'expense' as 'income' | 'expense',
  amount: '',
  category: '',
  description: '',
  payer: ''
})

const budgetForm = reactive({ category: '', limit: '' })
const shoppingForm = reactive({ name: '', quantity: '1' })
const dreamForm = reactive({ name: '', target: '', icon: '✈️' })

const addToDreamAmount = ref('')
const currentDreamFund = ref<any>(null)

const openDropdownName = ref('')
function openDropdown(name: string) { openDropdownName.value = openDropdownName.value === name ? '' : name }
function selectBillCat(cat: string) { addForm.category = cat; openDropdownName.value = '' }
function selectPayer(p: string) { addForm.payer = p; openDropdownName.value = '' }

const payers = computed(() => {
  const names = [userStore.userName, userStore.partnerName]
  return names.filter(Boolean).length > 0 ? names.filter(Boolean) : ['我', '伴侣']
})

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  billStore.loadData()
  userStore.loadUserNames()
  pollTimer = setInterval(() => { billStore.loadData() }, 3000)
})

onUnmounted(() => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
})

function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    '餐饮': '🍔', '娱乐': '🎮', '交通': '🚗', '购物': '🛍️',
    '医疗': '🏥', '教育': '📚', '工资': '💼', '奖金': '🎁', '其他': '💰'
  }
  return icons[category] || '💰'
}

function addRecord() {
  if (!addForm.amount || parseFloat(addForm.amount) <= 0) { uni.showToast({ title: '请输入金额', icon: 'none' }); return }
  if (!addForm.category) { uni.showToast({ title: '请选择分类', icon: 'none' }); return }
  if (!addForm.payer) { uni.showToast({ title: '请选择支付人', icon: 'none' }); return }
  billStore.addRecord({ type: addForm.type, amount: parseFloat(addForm.amount), category: addForm.category, description: addForm.description, date: new Date().toISOString().split('T')[0], payer: addForm.payer })
  showAddModal.value = false
  addForm.type = 'expense'; addForm.amount = ''; addForm.category = ''; addForm.description = ''; addForm.payer = ''
  openDropdownName.value = ''
  uni.showToast({ title: '记录成功', icon: 'success' })
}

function addBudget() {
  if (!budgetForm.category) { uni.showToast({ title: '请输入分类', icon: 'none' }); return }
  if (!budgetForm.limit || parseFloat(budgetForm.limit) <= 0) { uni.showToast({ title: '请输入预算金额', icon: 'none' }); return }
  billStore.addBudget({ category: budgetForm.category, limit: parseFloat(budgetForm.limit), spent: 0 })
  showBudgetModal.value = false; budgetForm.category = ''; budgetForm.limit = ''
  uni.showToast({ title: '预算添加成功', icon: 'success' })
}

function addShoppingItem() {
  if (!shoppingForm.name) { uni.showToast({ title: '请输入商品名称', icon: 'none' }); return }
  billStore.addShoppingItem({ name: shoppingForm.name, quantity: parseInt(shoppingForm.quantity) || 1, checked: false, addedBy: userStore.currentUserName })
  showShoppingModal.value = false; shoppingForm.name = ''; shoppingForm.quantity = '1'
  uni.showToast({ title: '添加成功', icon: 'success' })
}

function addDreamFund() {
  if (!dreamForm.name) { uni.showToast({ title: '请输入梦想名称', icon: 'none' }); return }
  if (!dreamForm.target || parseFloat(dreamForm.target) <= 0) { uni.showToast({ title: '请输入目标金额', icon: 'none' }); return }
  billStore.addDreamFund({ name: dreamForm.name, target: parseFloat(dreamForm.target), icon: dreamForm.icon })
  showDreamModal.value = false; dreamForm.name = ''; dreamForm.target = ''; dreamForm.icon = '✈️'
  uni.showToast({ title: '梦想基金创建成功', icon: 'success' })
}

function addToDream(fund: any) { currentDreamFund.value = fund; showAddToDreamModal.value = true; addToDreamAmount.value = '' }
function confirmAddToDream() {
  if (!addToDreamAmount.value || parseFloat(addToDreamAmount.value) <= 0) { uni.showToast({ title: '请输入金额', icon: 'none' }); return }
  billStore.addToDreamFund(currentDreamFund.value.id, parseFloat(addToDreamAmount.value))
  showAddToDreamModal.value = false; addToDreamAmount.value = ''; currentDreamFund.value = null
  uni.showToast({ title: '已添加', icon: 'success' })
}
</script>

<style lang="scss" scoped>
/* ════════════════════════════════════════════
   账单页 — iOS 粉白毛玻璃风格
   ════════════════════════════════════════════ */

.bill-container {
  min-height: 100vh;
  background: #FFF0F5;
  padding-bottom: 120rpx;
}

/* ── 导航栏 ── */
.nav-bar {
  height: 88rpx;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  display: flex;
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

/* ── Tab 栏 ── */
.tabs-glass {
  display: flex;
  background: rgba(255, 255, 255, 0.40);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  margin: 20rpx 24rpx;
  padding: 6rpx;
  border-radius: 48rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
}

.tab-item {
  flex: 1;
  padding: 24rpx 0;
  text-align: center;
  border-radius: 48rpx;
  transition: all 0.2s ease;

  &.active {
    background: rgba(255, 255, 255, 0.70);
    box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.08);

    .tab-text { color: #4A4A4A; font-weight: 500; }
  }
}

.tab-text {
  font-size: 26rpx;
  color: #8D8D8D;
  font-weight: 400;
}

/* ── 内容区 ── */
.content { padding: 0 24rpx; }

/* ── 添加按钮 ── */
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%);
  color: #fff;
  height: 96rpx;
  border-radius: 48rpx;
  margin-bottom: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.50);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.20);
  transition: transform 0.15s ease;
}

.add-btn:active { transform: scale(0.97); }

.add-icon { font-size: 40rpx; font-weight: 300; margin-right: 8rpx; }
.add-text { font-size: 30rpx; font-weight: 500; letter-spacing: 2rpx; }

/* ── 列表项 (毛玻璃卡片) ── */
.record-list, .budget-list, .shopping-list, .dream-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.record-item, .budget-item, .shopping-item, .dream-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 24rpx;
  border-radius: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
  transition: transform 0.15s ease;
}

.record-item:active { transform: scale(0.99); }

.record-icon {
  width: 72rpx; height: 72rpx;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; margin-right: 20rpx; flex-shrink: 0;

  &.income { background: rgba(168, 200, 168, 0.15); }
  &.expense { background: rgba(255, 182, 193, 0.15); }
}

.record-info { flex: 1; }
.record-category { font-size: 30rpx; color: #4A4A4A; display: block; margin-bottom: 6rpx; font-weight: 500; line-height: 1.5; }
.record-desc { font-size: 24rpx; color: #8D8D8D; font-weight: 400; }
.record-right { text-align: right; }
.record-amount { font-size: 32rpx; font-weight: 500; display: block; line-height: 1.4;
  &.income { color: #A0C8A0; }
  &.expense { color: #C2787A; }
}
.record-payer { font-size: 22rpx; color: #8D8D8D; font-weight: 400; }

/* ── 预算进度条 ── */
.budget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.budget-category { font-size: 28rpx; color: #4A4A4A; font-weight: 500; }
.budget-amount { font-size: 26rpx; color: #8D8D8D; }
.budget-progress { height: 8rpx; background: rgba(255, 182, 193, 0.15); border-radius: 4rpx; overflow: hidden; }

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #FFB6C1 0%, #FF99AA 100%);
  border-radius: 4rpx; transition: width 0.3s ease;

  &.warning { background: linear-gradient(90deg, #FFD4B0 0%, #FFC090 100%); }
  &.danger { background: linear-gradient(90deg, #FFB6C1 0%, #F0909A 100%); }
}

/* ── 购物清单 ── */
.shopping-item {
  &.checked { opacity: 0.55; }
}
.shopping-checkbox {
  width: 48rpx; height: 48rpx;
  border: 1.5px solid rgba(194, 120, 122, 0.30);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-right: 20rpx; flex-shrink: 0;

  &.checked {
    background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%);
    border-color: transparent;
  }
}
.check-icon { color: #fff; font-size: 24rpx; font-weight: 500; }
.shopping-info { flex: 1; display: flex; align-items: center; gap: 12rpx; }
.shopping-name { font-size: 28rpx; color: #4A4A4A; font-weight: 500; }
.shopping-quantity { font-size: 24rpx; color: #8D8D8D; }
.shopping-added { font-size: 22rpx; color: #B0A0A5; font-weight: 400; }

/* ── 梦想基金 ── */
.dream-icon-circle {
  width: 72rpx; height: 72rpx;
  background: rgba(255, 182, 193, 0.12);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; margin-right: 20rpx; flex-shrink: 0;
}
.dream-info { flex: 1; }
.dream-name { font-size: 28rpx; color: #4A4A4A; display: block; margin-bottom: 12rpx; font-weight: 500; }
.dream-progress { height: 8rpx; background: rgba(255, 182, 193, 0.15); border-radius: 4rpx; overflow: hidden; margin-bottom: 8rpx; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #FFB6C1 0%, #FF99AA 100%); border-radius: 4rpx; transition: width 0.3s ease; }
.dream-amount { font-size: 24rpx; color: #8D8D8D; }
.dream-add-btn {
  padding: 14rpx 24rpx;
  background: rgba(255, 182, 193, 0.12);
  border-radius: 48rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  transition: transform 0.15s ease;
  flex-shrink: 0;
  margin-left: 12rpx;
}
.dream-add-btn:active { transform: scale(0.95); }
.dream-add-text { font-size: 24rpx; color: #C2787A; font-weight: 400; }

/* ── 空状态 ── */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0; }
.empty-icon { font-size: 64rpx; margin-bottom: 16rpx; opacity: 0.6; }
.empty-text { font-size: 26rpx; color: #8D8D8D; font-weight: 400; }

/* ── 弹窗 (底部滑出毛玻璃) ── */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(194, 120, 122, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: flex-end; z-index: 1000;
}

.modal-sheet {
  width: 100%; max-height: 80vh; overflow-y: auto;
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

.modal-title {
  font-size: 34rpx; font-weight: 600; color: #4A4A4A;
  display: block; text-align: center; margin-bottom: 32rpx; letter-spacing: 2rpx;
}

.modal-body { margin-bottom: 32rpx; }

/* ── 表单控件 ── */
.form-group { margin-bottom: 24rpx; }
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

.custom-dropdown {
  position: relative; z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 182, 193, 0.30);
  border-radius: 24rpx;
  margin-top: 8rpx;
  box-shadow: 0 8rpx 32rpx rgba(255, 182, 193, 0.20);
  max-height: 400rpx;
  overflow-y: auto;
}

.dropdown-item {
  padding: 24rpx 32rpx;
  font-size: 28rpx;
  color: #4A4A4A;
  border-bottom: 1px solid rgba(255, 182, 193, 0.15);
  transition: background 0.2s ease;

  &:last-child { border-bottom: none; }

  &.active {
    background: rgba(255, 182, 193, 0.20);
    color: #FF6B8A;
    font-weight: 600;
  }

  &:active { background: rgba(255, 182, 193, 0.15); }
}

.type-tabs {
  display: flex;
  background: rgba(255, 182, 193, 0.10);
  border-radius: 48rpx; padding: 6rpx; margin-bottom: 24rpx;
}

.type-tab {
  flex: 1; text-align: center; padding: 20rpx;
  border-radius: 48rpx; font-size: 28rpx; color: #8D8D8D;
  transition: all 0.2s ease;

  &.active {
    background: rgba(255, 255, 255, 0.70);
    color: #4A4A4A; font-weight: 500;
    box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.08);
  }
}

/* ── 图标选择器 ── */
.icon-picker { display: flex; flex-wrap: wrap; gap: 16rpx; }
.icon-option {
  width: 80rpx; height: 80rpx;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 24rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx;
  border: 1px solid rgba(255, 255, 255, 0.60);
  transition: all 0.2s ease;

  &.selected {
    background: rgba(255, 182, 193, 0.18);
    border-color: rgba(255, 255, 255, 0.85);
    box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.10);
  }
}

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

  &:active { transform: scale(0.96); }
}
</style>
