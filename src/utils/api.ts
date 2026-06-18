import cloudbase from '@cloudbase/js-sdk'

// CloudBase 环境 ID
const ENV_ID = 'jayden5211104-d2gji5i911b4bb7de2e'

// 初始化 CloudBase（匿名登录）
const app = cloudbase.init({ env: ENV_ID })
const auth = app.auth({ persistence: 'local' })
const db = app.database()

// 匿名登录
async function ensureLogin() {
  const loginState = await auth.getLoginState()
  if (!loginState) {
    await auth.anonymousAuthProvider().signIn()
  }
}

// 获取数据库引用
function getCollection(name: string) {
  return db.collection(name)
}

// 查询数据
export async function apiGet(pairId: string, type: string) {
  try {
    await ensureLogin()
    const result = await getCollection(type).where({ pairId }).get()
    return result.data || []
  } catch (e) {
    console.error('[API GET ERROR]', e)
    return []
  }
}

// 创建数据
export async function apiPost(pairId: string, type: string, data: any) {
  try {
    await ensureLogin()
    const newRecord = {
      id: 'item_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      pairId,
      type,
      ...data,
      createdAt: new Date().toISOString()
    }
    await getCollection(type).add(newRecord)
    return newRecord
  } catch (e) {
    console.error('[API POST ERROR]', e)
    return null
  }
}

// 更新数据
export async function apiPut(pairId: string, type: string, id: string, data: any) {
  try {
    await ensureLogin()
    const result = await getCollection(type).where({ id, pairId }).get()
    if (result.data && result.data.length > 0) {
      const docId = result.data[0]._id
      await getCollection(type).doc(docId).update({
        ...data,
        updatedAt: new Date().toISOString()
      })
      return { ...result.data[0], ...data }
    }
    return null
  } catch (e) {
    console.error('[API PUT ERROR]', e)
    return null
  }
}

// 删除数据
export async function apiDelete(pairId: string, type: string, id: string) {
  try {
    await ensureLogin()
    const result = await getCollection(type).where({ id, pairId }).get()
    if (result.data && result.data.length > 0) {
      const docId = result.data[0]._id
      await getCollection(type).doc(docId).remove()
      return { success: true }
    }
    return { success: false }
  } catch (e) {
    console.error('[API DELETE ERROR]', e)
    return { success: false }
  }
}
