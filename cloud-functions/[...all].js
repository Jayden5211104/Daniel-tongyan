// EdgeOne Cloud Functions - 同檐后端 API（CloudBase 数据库版）
const cloudbase = require('@cloudbase/node-sdk');

// 【重要】请将 '你的环境ID' 替换为第一步创建的实际环境ID
const app = cloudbase.init({
  env: '你的环境ID'  // 例如: 'your-env-id-xxxxx'
});

const db = app.database();

// 集合引用
const pairsCollection = db.collection('pairs');
const usersCollection = db.collection('users');
const recordsCollection = db.collection('records');

// 工具函数
function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function jsonError(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function parsePath(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

// 主入口
export default async function onRequest(context) {
  const request = context.request;
  const method = request.method;
  const pathname = parsePath(request.url);

  // CORS 预检
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  // POST /api/login - 登录/创建配对（暗号+名字方式）
  if (pathname === '/api/login' && method === 'POST') {
    const body = await parseBody(request);
    if (!body) return jsonError('无效的请求体');

    const { secret_code, name, role, partner_name } = body;
    if (!secret_code || secret_code.length < 6) return jsonError('暗号至少需要6位');
    if (!name) return jsonError('请输入名字');

    // 查找或创建配对
    let pairResult = await pairsCollection.where({ secret_code }).get();
    let pair;

    if (pairResult.data && pairResult.data.length > 0) {
      pair = pairResult.data[0];
    } else {
      const newPair = {
        pairId: 'pair_' + uuid(),
        secret_code,
        partner_name: partner_name || '',
        createdAt: new Date().toISOString()
      };
      await pairsCollection.add(newPair);
      pair = newPair;
    }

    // 更新 partner_name（如果提供了）
    if (partner_name && pair.partner_name !== partner_name) {
      await pairsCollection.where({ pairId: pair.pairId }).update({ partner_name });
      pair.partner_name = partner_name;
    }

    // 查找或创建用户
    let userResult = await usersCollection.where({
      pairId: pair.pairId,
      name
    }).get();
    let user;

    if (userResult.data && userResult.data.length > 0) {
      user = userResult.data[0];
      // 更新角色
      if (user.role !== role) {
        await usersCollection.doc(user._id).update({ role });
        user.role = role;
      }
    } else {
      const newUser = {
        userId: 'user_' + uuid(),
        pairId: pair.pairId,
        name,
        role,
        createdAt: new Date().toISOString()
      };
      await usersCollection.add(newUser);
      user = newUser;
    }

    // 查找伴侣（获取同一 pairId 下的其他用户）
    let partner = null;
    const allUsersInPair = await usersCollection.where({ pairId: pair.pairId }).get();
    if (allUsersInPair.data && allUsersInPair.data.length > 0) {
      partner = allUsersInPair.data.find(u => u.userId !== user.userId);
    }

    return jsonResponse({
      token: 'token_' + uuid(),
      user_id: user.userId,
      pair_id: pair.pairId,
      user: { ...user, id: user.userId },
      pair: { ...pair, id: pair.pairId },
      partner_name: partner ? partner.name : (pair.partner_name || '')
    });
  }

  // GET /api/partner/:pairId/:userId - 获取伴侣名字
  const partnerMatch = pathname.match(/^\/api\/partner\/([^\/]+)\/([^\/]+)$/);
  if (partnerMatch && method === 'GET') {
    const [, pairId, userId] = partnerMatch;

    // 查找该配对下的另一个用户
    const partnerResult = await usersCollection.where({
      pairId,
      userId: db.command.neq(userId)
    }).get();

    const partner = partnerResult.data?.[0];
    return jsonResponse({
      name: partner ? partner.name : ''
    });
  }

  // GET /api/data/:pairId/:type - 查询数据
  const getMatch = pathname.match(/^\/api\/data\/([^\/]+)\/([^\/]+)$/);
  if (getMatch && method === 'GET') {
    const [, pairId, type] = getMatch;
    const result = await recordsCollection.where({ pairId, type }).get();
    // 兼容前端 pair_id 字段
    const records = (result.data || []).map(r => ({ ...r, pair_id: r.pairId }));
    return jsonResponse(records);
  }

  // POST /api/data/:pairId/:type - 创建数据
  const postMatch = pathname.match(/^\/api\/data\/([^\/]+)\/([^\/]+)$/);
  if (postMatch && method === 'POST') {
    const [, pairId, type] = postMatch;
    const body = await parseBody(request);
    if (!body) return jsonError('无效的请求体');

    // 兼容前端 pair_id 字段，统一转为 pairId 存储
    const normalizedBody = { ...body };
    if (normalizedBody.pair_id && !normalizedBody.pairId) {
      normalizedBody.pairId = normalizedBody.pair_id;
    }

    const newRecord = {
      id: 'item_' + uuid(),
      pairId,
      type,
      ...normalizedBody,
      createdAt: new Date().toISOString()
    };
    await recordsCollection.add(newRecord);

    // 返回时兼容前端 pair_id 字段
    const respRecord = { ...newRecord, pair_id: newRecord.pairId };
    return jsonResponse(respRecord, 201);
  }

  // PUT /api/data/:pairId/:type/:id - 更新数据
  const putMatch = pathname.match(/^\/api\/data\/([^\/]+)\/([^\/]+)\/([^\/]+)$/);
  if (putMatch && method === 'PUT') {
    const [, pairId, type, id] = putMatch;
    const body = await parseBody(request);
    if (!body) return jsonError('无效的请求体');

    const result = await recordsCollection.where({ id, pairId, type }).get();
    const existing = result.data?.[0];
    if (!existing) return jsonError('记录不存在', 404);

    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    await recordsCollection.doc(existing._id).update(updated);
    // 兼容前端 pair_id 字段
    return jsonResponse({ ...updated, pair_id: updated.pairId });
  }

  // DELETE /api/data/:pairId/:type/:id - 删除数据
  const deleteMatch = pathname.match(/^\/api\/data\/([^\/]+)\/([^\/]+)\/([^\/]+)$/);
  if (deleteMatch && method === 'DELETE') {
    const [, pairId, type, id] = deleteMatch;

    const result = await recordsCollection.where({ id, pairId, type }).get();
    const existing = result.data?.[0];
    if (!existing) return jsonError('记录不存在', 404);

    await recordsCollection.doc(existing._id).remove();
    return jsonResponse({ success: true });
  }

  // 未匹配到任何路由
  return jsonError('Not Found', 404);
}
