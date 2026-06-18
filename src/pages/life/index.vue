<template>
  <view class="life-container">
    <view class="nav-bar">
      <text class="nav-title">生活</text>
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

    <!-- 家务 -->
    <view v-if="activeTab === 'chore'" class="content">
      <view class="add-btn" @click="showChoreModal = true">
        <text class="add-icon">+</text>
        <text class="add-text">添加家务</text>
      </view>
      <view v-if="lifeStore.chores.length > 0" class="list-col">
        <view v-for="chore in lifeStore.chores" :key="chore.id" class="chore-item">
          <view :class="['chore-check', { checked: chore.completed }]" @click="lifeStore.toggleChore(chore.id)">
            <text v-if="chore.completed" class="check-icon">✓</text>
          </view>
          <view class="chore-info">
            <text :class="['chore-name', { done: chore.completed }]">{{ chore.name }}</text>
            <view class="chore-meta">
              <text class="chore-assignee">{{ chore.assignee }}</text>
              <text class="chore-dot">·</text>
              <text class="chore-cycle">{{ cycleMap[chore.cycle] }}</text>
            </view>
          </view>
          <view :class="['chore-tag', chore.completed ? 'done' : 'pending']">
            <text>{{ chore.completed ? '已完成' : '待完成' }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">🧹</text>
        <text class="empty-text">还没有家务任务</text>
      </view>
    </view>

    <!-- 库存 -->
    <view v-if="activeTab === 'inventory'" class="content">
      <view class="add-btn" @click="showInventoryModal = true">
        <text class="add-icon">+</text>
        <text class="add-text">添加物品</text>
      </view>
      <view v-if="lifeStore.inventory.length > 0" class="list-col">
        <view v-for="item in lifeStore.inventory" :key="item.id" class="inv-item">
          <view class="inv-icon">{{ getCategoryIcon(item.category) }}</view>
          <view class="inv-info">
            <text class="inv-name">{{ item.name }}</text>
            <text class="inv-cat">{{ item.category }}</text>
          </view>
          <view class="inv-qty">
            <text :class="{ low: item.lowStock }">{{ item.quantity }}{{ item.unit }}</text>
          </view>
          <view class="item-actions">
            <view class="act-btn edit" @click="editInventory(item)"><text>✏️</text></view>
            <view class="act-btn" @click="deleteInventory(item)"><text>🗑️</text></view>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-text">还没有库存物品</text>
      </view>
    </view>

    <!-- 旅行 -->
    <view v-if="activeTab === 'travel'" class="content">
      <view class="add-btn" @click="showTravelModal = true">
        <text class="add-icon">+</text>
        <text class="add-text">添加旅行计划</text>
      </view>
      <view v-if="lifeStore.travelPlans.length > 0" class="list-col">
        <view v-for="plan in lifeStore.travelPlans" :key="plan.id" class="travel-item">
          <view class="travel-header">
            <text class="travel-name">{{ plan.name }}</text>
            <text class="travel-dest">📍 {{ plan.destination }}</text>
          </view>
          <view class="travel-dates"><text>{{ plan.startDate }} ~ {{ plan.endDate }}</text></view>
          <view class="travel-budget"><text>预算：¥{{ formatNumber(plan.budget) }}</text></view>
          <view v-if="plan.checklist.length > 0" class="travel-checklist">
            <view v-for="item in plan.checklist" :key="item.id" :class="['check-item', { done: item.done }]" @click="lifeStore.toggleTravelChecklist(plan.id, item.id)">
              <view :class="['check-dot', { done: item.done }]"><text v-if="item.done">✓</text></view>
              <text :class="{ done: item.done }">{{ item.item }}</text>
            </view>
          </view>
          <view class="item-actions">
            <view class="act-btn edit" @click="editTravel(plan)"><text>✏️</text></view>
            <view class="act-btn" @click="deleteTravel(plan)"><text>🗑️</text></view>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">✈️</text>
        <text class="empty-text">还没有旅行计划</text>
      </view>
    </view>

    <!-- 食谱 -->
    <view v-if="activeTab === 'recipe'" class="content">
      <view class="add-btn" @click="showRecipeModal = true">
        <text class="add-icon">+</text>
        <text class="add-text">添加食谱</text>
      </view>
      <view v-if="lifeStore.recipes.length > 0" class="list-col">
        <view v-for="recipe in lifeStore.recipes" :key="recipe.id" class="recipe-item">
          <view class="recipe-icon">🍳</view>
          <view class="recipe-info">
            <text class="recipe-name">{{ recipe.name }}</text>
            <text class="recipe-meta">{{ recipe.category }} · {{ recipe.servings }}人份</text>
          </view>
          <view class="item-actions">
            <view class="act-btn edit" @click="editRecipeItem(recipe)"><text>✏️</text></view>
            <view class="act-btn" @click="deleteRecipe(recipe)"><text>🗑️</text></view>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-icon">🍳</text>
        <text class="empty-text">还没有食谱</text>
      </view>
    </view>

    <!-- Modals -->
    <view v-if="showChoreModal" class="modal-overlay" @click="showChoreModal = false">
      <view class="modal-sheet" @click.stop>
        <text class="modal-title">添加家务</text>
        <view class="modal-body">
          <view class="form-group"><text class="form-label">任务名称</text><input v-model="choreForm.name" type="text" placeholder="如：倒垃圾、拖地" class="glass-input" /></view>
          <view class="form-group">
            <text class="form-label">负责人</text>
            <view class="glass-picker" @click="openDropdown('assignee')">
              <text>{{ choreForm.assignee || '选择负责人' }}</text><text class="picker-arrow">›</text>
            </view>
            <view v-if="openDropdownName === 'assignee'" class="custom-dropdown">
              <view v-for="(name, idx) in assignees" :key="idx" :class="['dropdown-item', { active: choreForm.assignee === name }]" @click="selectAssignee(name)">
                <text>{{ name }}</text>
              </view>
            </view>
          </view>
          <view class="form-group">
            <text class="form-label">周期</text>
            <view class="options-row">
              <view v-for="cycle in cycles" :key="cycle.value" :class="['opt-btn', { active: choreForm.cycle === cycle.value }]" @click="choreForm.cycle = cycle.value"><text>{{ cycle.label }}</text></view>
            </view>
          </view>
        </view>
        <view class="modal-actions"><button @click="showChoreModal = false" class="btn-glass">取消</button><button @click="addChore" class="btn-accent">保存</button></view>
      </view>
    </view>

    <view v-if="showInventoryModal" class="modal-overlay" @click="showInventoryModal = false">
      <view class="modal-sheet" @click.stop>
        <text class="modal-title">{{ editingInventory ? '编辑物品' : '添加物品' }}</text>
        <view class="modal-body">
          <view class="form-group"><text class="form-label">物品名称</text><input v-model="inventoryForm.name" type="text" placeholder="如：牛奶、鸡蛋" class="glass-input" /></view>
          <view class="form-group">
            <text class="form-label">分类</text>
            <view class="glass-picker" @click="openDropdown('inventoryCat')">
              <text>{{ inventoryForm.category || '选择分类' }}</text><text class="picker-arrow">›</text>
            </view>
            <view v-if="openDropdownName === 'inventoryCat'" class="custom-dropdown">
              <view v-for="(cat, idx) in inventoryCategories" :key="idx" :class="['dropdown-item', { active: inventoryForm.category === cat }]" @click="selectInventoryCat(cat)">
                <text>{{ cat }}</text>
              </view>
            </view>
          </view>
          <view class="form-group"><text class="form-label">数量</text><input v-model="inventoryForm.quantity" type="number" placeholder="1" class="glass-input" /></view>
          <view class="form-group"><text class="form-label">单位</text><input v-model="inventoryForm.unit" type="text" placeholder="如：瓶、个" class="glass-input" /></view>
        </view>
        <view class="modal-actions"><button @click="showInventoryModal = false" class="btn-glass">取消</button><button @click="addInventoryItem" class="btn-accent">保存</button></view>
      </view>
    </view>

    <view v-if="showTravelModal" class="modal-overlay" @click="showTravelModal = false">
      <view class="modal-sheet" @click.stop>
        <text class="modal-title">{{ editingTravel ? '编辑旅行计划' : '添加旅行计划' }}</text>
        <view class="modal-body">
          <view class="form-group"><text class="form-label">计划名称</text><input v-model="travelForm.name" type="text" placeholder="如：北欧旅行" class="glass-input" /></view>
          <view class="form-group"><text class="form-label">目的地</text><input v-model="travelForm.destination" type="text" placeholder="如：冰岛" class="glass-input" /></view>
          <view class="form-group"><text class="form-label">开始日期</text><input v-model="travelForm.startDate" type="date" class="glass-input" /></view>
          <view class="form-group"><text class="form-label">结束日期</text><input v-model="travelForm.endDate" type="date" class="glass-input" /></view>
          <view class="form-group"><text class="form-label">预算金额</text><input v-model="travelForm.budget" type="digit" placeholder="0.00" class="glass-input" /></view>
        </view>
        <view class="modal-actions"><button @click="showTravelModal = false" class="btn-glass">取消</button><button @click="addTravelPlan" class="btn-accent">保存</button></view>
      </view>
    </view>

    <view v-if="showRecipeModal" class="modal-overlay" @click="showRecipeModal = false">
      <view class="modal-sheet" @click.stop>
        <text class="modal-title">{{ editingRecipe ? '编辑食谱' : '添加食谱' }}</text>
        <view class="modal-body">
          <view class="form-group"><text class="form-label">食谱名称</text><input v-model="recipeForm.name" type="text" placeholder="如：番茄炒蛋" class="glass-input" /></view>
          <view class="form-group">
            <text class="form-label">分类</text>
            <view class="glass-picker" @click="openDropdown('recipeCat')">
              <text>{{ recipeForm.category || '选择分类' }}</text><text class="picker-arrow">›</text>
            </view>
            <view v-if="openDropdownName === 'recipeCat'" class="custom-dropdown">
              <view v-for="(cat, idx) in recipeCategories" :key="idx" :class="['dropdown-item', { active: recipeForm.category === cat }]" @click="selectRecipeCat(cat)">
                <text>{{ cat }}</text>
              </view>
            </view>
          </view>
          <view class="form-group"><text class="form-label">份量</text><input v-model="recipeForm.servings" type="number" placeholder="2" class="glass-input" /></view>
          <view class="form-group"><text class="form-label">食材</text><textarea v-model="recipeForm.ingredients" placeholder="每种食材一行" class="glass-textarea"></textarea></view>
          <view class="form-group"><text class="form-label">步骤</text><textarea v-model="recipeForm.steps" placeholder="每步一行" class="glass-textarea"></textarea></view>
        </view>
        <view class="modal-actions"><button @click="showRecipeModal = false" class="btn-glass">取消</button><button @click="addRecipe" class="btn-accent">保存</button></view>
      </view>
    </view>

    <TabBar current="/pages/life/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useLifeStore } from '@/stores/life'
import { useUserStore } from '@/stores/user'
import TabBar from '@/components/TabBar.vue'

const lifeStore = useLifeStore()
const userStore = useUserStore()

const tabs = [
  { key: 'chore', label: '家务分工' },
  { key: 'inventory', label: '库存管理' },
  { key: 'travel', label: '旅行计划' },
  { key: 'recipe', label: '食谱库' }
]

const cycleMap: Record<string, string> = { daily: '每天', weekly: '每周', monthly: '每月' }
const cycles = [{ value: 'daily', label: '每天' }, { value: 'weekly', label: '每周' }, { value: 'monthly', label: '每月' }]
const inventoryCategories = ['食材', '药品', '日用品', '其他']
const recipeCategories = ['早餐', '午餐', '晚餐', '甜点', '饮品']

const activeTab = ref('chore')
const showChoreModal = ref(false); const showInventoryModal = ref(false)
const showTravelModal = ref(false); const showRecipeModal = ref(false)
const openDropdownName = ref('')

const choreForm = reactive({ name: '', assignee: '', cycle: 'weekly' as string })
const inventoryForm = reactive({ name: '', category: '', quantity: '1', unit: '' })
const travelForm = reactive({ name: '', destination: '', startDate: '', endDate: '', budget: '' })
const recipeForm = reactive({ name: '', category: '', servings: '2', ingredients: '', steps: '' })

const editingInventory = ref<any>(null); const editingTravel = ref<any>(null); const editingRecipe = ref<any>(null)
const assigneeIndex = ref(0); const categoryIndex = ref(0); const recipeCategoryIndex = ref(0)

const assignees = computed(() => {
  const n1 = userStore.userName || '我'; const n2 = userStore.partnerName || '伴侣'
  return n1 && n2 && n1 !== n2 ? [n1, n2] : n1 && !n2 ? [n1, '伴侣'] : !n1 && n2 ? ['我', n2] : ['我', '伴侣']
})

let pollTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => { lifeStore.loadData(); userStore.loadUserNames(); pollTimer = setInterval(() => { lifeStore.loadData() }, 3000) })
onUnmounted(() => { if (pollTimer) { clearInterval(pollTimer); pollTimer = null } })

function formatNumber(n: number) { return n.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }
function getCategoryIcon(c: string) { const m: Record<string,string> = { '食材':'🥬','药品':'💊','日用品':'🧴','其他':'📦' }; return m[c] || '📦' }
function onAssigneeChange(e: any) { assigneeIndex.value = e.detail.value; choreForm.assignee = assignees.value[e.detail.value] }
function onInventoryCategoryChange(e: any) { categoryIndex.value = e.detail.value; inventoryForm.category = inventoryCategories[e.detail.value] }
function onRecipeCategoryChange(e: any) { recipeCategoryIndex.value = e.detail.value; recipeForm.category = recipeCategories[e.detail.value] }
function openDropdown(name: string) { openDropdownName.value = openDropdownName.value === name ? '' : name }
function selectAssignee(name: string) { choreForm.assignee = name; openDropdownName.value = '' }
function selectInventoryCat(cat: string) { inventoryForm.category = cat; openDropdownName.value = '' }
function selectRecipeCat(cat: string) { recipeForm.category = cat; openDropdownName.value = '' }
function onStartDateChange(e: any) { travelForm.startDate = e.detail.value }
function onEndDateChange(e: any) { travelForm.endDate = e.detail.value }

function addChore() {
  if (!choreForm.name) { uni.showToast({ title: '请输入任务名称', icon: 'none' }); return }
  if (!choreForm.assignee) { uni.showToast({ title: '请选择负责人', icon: 'none' }); return }
  lifeStore.addChore({ name: choreForm.name, assignee: choreForm.assignee, cycle: choreForm.cycle as any, lastDone: '', nextDue: new Date().toISOString().split('T')[0] })
  showChoreModal.value = false; choreForm.name = ''; choreForm.assignee = ''; choreForm.cycle = 'weekly'; assigneeIndex.value = 0
  uni.showToast({ title: '添加成功', icon: 'success' })
}
function addInventoryItem() {
  if (!inventoryForm.name) { uni.showToast({ title: '请输入物品名称', icon: 'none' }); return }
  if (!inventoryForm.category) { uni.showToast({ title: '请选择分类', icon: 'none' }); return }
  if (!inventoryForm.quantity || parseInt(inventoryForm.quantity) <= 0) { uni.showToast({ title: '请输入数量', icon: 'none' }); return }
  if (editingInventory.value) { lifeStore.updateInventoryItem({ id: editingInventory.value.id, name: inventoryForm.name, category: inventoryForm.category, quantity: parseInt(inventoryForm.quantity), unit: inventoryForm.unit || '个' }); uni.showToast({ title: '修改成功', icon: 'success' }) }
  else { lifeStore.addInventoryItem({ name: inventoryForm.name, category: inventoryForm.category, quantity: parseInt(inventoryForm.quantity), unit: inventoryForm.unit || '个' }); uni.showToast({ title: '添加成功', icon: 'success' }) }
  showInventoryModal.value = false; inventoryForm.name = ''; inventoryForm.category = ''; inventoryForm.quantity = '1'; inventoryForm.unit = ''; categoryIndex.value = 0; editingInventory.value = null
}
function editInventory(item: any) { editingInventory.value = item; inventoryForm.name = item.name; inventoryForm.category = item.category; inventoryForm.quantity = item.quantity.toString(); inventoryForm.unit = item.unit; categoryIndex.value = inventoryCategories.indexOf(item.category); showInventoryModal.value = true }
function deleteInventory(item: any) { uni.showModal({ title: '确认删除', content: `确定要删除"${item.name}"吗？`, success: (res) => { if (res.confirm) { lifeStore.deleteInventoryItem(item.id); uni.showToast({ title: '删除成功', icon: 'success' }) } } }) }
function addTravelPlan() {
  if (!travelForm.name) { uni.showToast({ title: '请输入计划名称', icon: 'none' }); return }
  if (!travelForm.destination) { uni.showToast({ title: '请输入目的地', icon: 'none' }); return }
  if (!travelForm.startDate || !travelForm.endDate) { uni.showToast({ title: '请选择日期', icon: 'none' }); return }
  if (editingTravel.value) { lifeStore.updateTravelPlan({ id: editingTravel.value.id, name: travelForm.name, destination: travelForm.destination, startDate: travelForm.startDate, endDate: travelForm.endDate, budget: parseFloat(travelForm.budget) || 0, checklist: editingTravel.value.checklist }); uni.showToast({ title: '修改成功', icon: 'success' }) }
  else { lifeStore.addTravelPlan({ name: travelForm.name, destination: travelForm.destination, startDate: travelForm.startDate, endDate: travelForm.endDate, budget: parseFloat(travelForm.budget) || 0, checklist: [] }); uni.showToast({ title: '添加成功', icon: 'success' }) }
  showTravelModal.value = false; travelForm.name = ''; travelForm.destination = ''; travelForm.startDate = ''; travelForm.endDate = ''; travelForm.budget = ''; editingTravel.value = null
}
function editTravel(p: any) { editingTravel.value = p; travelForm.name = p.name; travelForm.destination = p.destination; travelForm.startDate = p.startDate; travelForm.endDate = p.endDate; travelForm.budget = p.budget.toString(); showTravelModal.value = true }
function deleteTravel(p: any) { uni.showModal({ title: '确认删除', content: `确定要删除"${p.name}"吗？`, success: (res) => { if (res.confirm) { lifeStore.deleteTravelPlan(p.id); uni.showToast({ title: '删除成功', icon: 'success' }) } } }) }
function addRecipe() {
  if (!recipeForm.name) { uni.showToast({ title: '请输入食谱名称', icon: 'none' }); return }
  if (!recipeForm.category) { uni.showToast({ title: '请选择分类', icon: 'none' }); return }
  if (editingRecipe.value) { lifeStore.updateRecipe({ id: editingRecipe.value.id, name: recipeForm.name, category: recipeForm.category, servings: parseInt(recipeForm.servings) || 2, ingredients: recipeForm.ingredients.split('\n').filter(Boolean), steps: recipeForm.steps.split('\n').filter(Boolean) }); uni.showToast({ title: '修改成功', icon: 'success' }) }
  else { lifeStore.addRecipe({ name: recipeForm.name, category: recipeForm.category, servings: parseInt(recipeForm.servings) || 2, ingredients: recipeForm.ingredients.split('\n').filter(Boolean), steps: recipeForm.steps.split('\n').filter(Boolean) }); uni.showToast({ title: '添加成功', icon: 'success' }) }
  showRecipeModal.value = false; recipeForm.name = ''; recipeForm.category = ''; recipeForm.servings = '2'; recipeForm.ingredients = ''; recipeForm.steps = ''; recipeCategoryIndex.value = 0; editingRecipe.value = null
}
function editRecipeItem(r: any) { editingRecipe.value = r; recipeForm.name = r.name; recipeForm.category = r.category; recipeForm.servings = r.servings.toString(); recipeForm.ingredients = r.ingredients.join('\n'); recipeForm.steps = r.steps.join('\n'); recipeCategoryIndex.value = recipeCategories.indexOf(r.category); showRecipeModal.value = true }
function deleteRecipe(r: any) { uni.showModal({ title: '确认删除', content: `确定要删除"${r.name}"吗？`, success: (res) => { if (res.confirm) { lifeStore.deleteRecipe(r.id); uni.showToast({ title: '删除成功', icon: 'success' }) } } }) }
</script>

<style lang="scss" scoped>
.life-container {
  min-height: 100vh;
  background: #FFF0F5;
  padding-bottom: 120rpx;
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
  &.active { background: rgba(255, 255, 255, 0.70); box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.08); .tab-text { color: #4A4A4A; font-weight: 500; } }
}
.tab-text { font-size: 24rpx; color: #8D8D8D; font-weight: 400; }

.content { padding: 0 24rpx; }

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

/* ── 列表 ── */
.list-col { display: flex; flex-direction: column; gap: 16rpx; }

.chore-item, .inv-item, .travel-item, .recipe-item {
  display: flex; align-items: center;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 24rpx; border-radius: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06);
}

/* ── 家务 ── */
.chore-check {
  width: 48rpx; height: 48rpx;
  border: 1.5px solid rgba(194, 120, 122, 0.30);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-right: 20rpx; flex-shrink: 0;

  &.checked { background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%); border-color: transparent; }
}
.check-icon { color: #fff; font-size: 24rpx; font-weight: 500; }

.chore-info { flex: 1; }
.chore-name { font-size: 28rpx; color: #4A4A4A; display: block; margin-bottom: 6rpx; font-weight: 500; line-height: 1.5;
  &.done { color: #B0A0A5; text-decoration: line-through; }
}
.chore-meta { display: flex; align-items: center; gap: 6rpx; }
.chore-assignee, .chore-cycle, .chore-dot { font-size: 24rpx; color: #8D8D8D; font-weight: 400; }

.chore-tag {
  padding: 8rpx 20rpx; border-radius: 48rpx; font-size: 22rpx; font-weight: 400; flex-shrink: 0;
  &.pending { background: rgba(255, 182, 193, 0.12); color: #C2787A; }
  &.done { background: rgba(160, 200, 160, 0.12); color: #A0C8A0; }
}

/* ── 库存 ── */
.inv-icon {
  width: 72rpx; height: 72rpx; background: rgba(255, 182, 193, 0.12);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; margin-right: 20rpx; flex-shrink: 0;
}
.inv-info { flex: 1; }
.inv-name { font-size: 28rpx; color: #4A4A4A; display: block; margin-bottom: 4rpx; font-weight: 500; }
.inv-cat { font-size: 24rpx; color: #8D8D8D; }
.inv-qty {
  margin-right: 16rpx;
  text { font-size: 32rpx; font-weight: 500; color: #4A4A4A; &.low { color: #C2787A; } }
}

.item-actions { display: flex; gap: 12rpx; }
.act-btn {
  width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center;
  border-radius: 48rpx; font-size: 28rpx;
  background: rgba(255, 255, 255, 0.45); border: 1px solid rgba(255, 255, 255, 0.65);
  &.edit { background: rgba(160, 200, 160, 0.12); }
}

/* ── 旅行 ── */
.travel-item { flex-direction: column; align-items: stretch; }
.travel-header { margin-bottom: 10rpx; }
.travel-name { font-size: 30rpx; font-weight: 600; color: #4A4A4A; display: block; margin-bottom: 6rpx; }
.travel-dest { font-size: 26rpx; color: #8D8D8D; }
.travel-dates text { font-size: 24rpx; color: #B0A0A5; }
.travel-budget { margin-top: 6rpx; text { font-size: 26rpx; color: #C2787A; } }

.travel-checklist {
  background: rgba(255, 255, 255, 0.40); border-radius: 20rpx; padding: 16rpx;
  border: 1px solid rgba(255, 255, 255, 0.60); margin: 12rpx 0;
}
.check-item { display: flex; align-items: center; padding: 10rpx 0; }
.check-dot {
  width: 40rpx; height: 40rpx; border: 1.5px solid rgba(194, 120, 122, 0.25);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  margin-right: 14rpx; font-size: 22rpx;

  &.done { background: #A0C8A0; border-color: #A0C8A0; color: #fff; }
}
.check-item text { font-size: 26rpx; color: #4A4A4A; line-height: 1.5;
  &.done { color: #B0A0A5; text-decoration: line-through; }
}

/* ── 食谱 ── */
.recipe-icon {
  width: 72rpx; height: 72rpx; background: rgba(255, 182, 193, 0.12);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; margin-right: 20rpx; flex-shrink: 0;
}
.recipe-info { flex: 1; }
.recipe-name { font-size: 28rpx; color: #4A4A4A; display: block; margin-bottom: 4rpx; font-weight: 500; }
.recipe-meta { font-size: 24rpx; color: #8D8D8D; }

/* ── 空状态 ── */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0; }
.empty-icon { font-size: 64rpx; margin-bottom: 16rpx; opacity: 0.6; }
.empty-text { font-size: 26rpx; color: #8D8D8D; font-weight: 400; }

/* ── 弹窗 ── */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(194, 120, 122, 0.12); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: flex-end; z-index: 1000; }
.modal-sheet { width: 100%; max-height: 80vh; overflow-y: auto; background: rgba(255, 255, 255, 0.72); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 36rpx 36rpx 0 0; padding: 32rpx; padding-bottom: calc(32rpx + env(safe-area-inset-bottom)); border: 1px solid rgba(255, 255, 255, 0.85); border-bottom: none; box-shadow: 0 -4rpx 30rpx rgba(255, 182, 193, 0.12); }
.modal-title { font-size: 34rpx; font-weight: 600; color: #4A4A4A; display: block; text-align: center; margin-bottom: 32rpx; letter-spacing: 2rpx; }
.modal-body { margin-bottom: 32rpx; }

.form-group { margin-bottom: 24rpx; position: relative; }
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
.glass-textarea { width: 100%; height: 160rpx; border: 1px solid rgba(255, 255, 255, 0.70); border-radius: 24rpx; padding: 20rpx; font-size: 28rpx; box-sizing: border-box; background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: #4A4A4A; }
.picker-arrow { font-size: 36rpx; color: #B0A0A5; font-weight: 300; }

.options-row { display: flex; gap: 16rpx; }
.opt-btn {
  flex: 1; text-align: center; padding: 20rpx;
  background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  border-radius: 48rpx; font-size: 26rpx; color: #8D8D8D;
  border: 1px solid rgba(255, 255, 255, 0.65); transition: all 0.2s ease;

  &.active { background: rgba(255, 182, 193, 0.18); border-color: rgba(255, 255, 255, 0.85); color: #4A4A4A; font-weight: 500; box-shadow: 0 2rpx 8rpx rgba(255, 182, 193, 0.10); }
}

.modal-actions { display: flex; gap: 24rpx; }
.btn-glass { flex: 1; height: 96rpx; font-size: 28rpx; border-radius: 48rpx; background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.70); color: #4A4A4A; font-weight: 400; box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.06); }
.btn-accent { flex: 1; height: 96rpx; font-size: 28rpx; border-radius: 48rpx; background: linear-gradient(135deg, #FFB6C1 0%, #FF99AA 100%); color: #fff; border: 1px solid rgba(255, 255, 255, 0.50); box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.20); font-weight: 500; letter-spacing: 1px; transition: transform 0.15s ease; }
.btn-accent:active { transform: scale(0.96); }
</style>
