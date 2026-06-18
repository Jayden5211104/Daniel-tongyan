// EdgeOne Cloud Functions - 同檐后端 API（兼容 KV + 内存降级）

// 内存存储（KV 不可用时的降级方案）
let memoryStore = { pairs: [], users: [], records: [] };

// 工具函数
function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
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

// 数据存储：优先用 KV，不可用时降级到内存
async function getStore(env) {
  // 尝试 KV 存储
  if (env && env.DATA) {
    try {
      const data = await env.DATA.get('store');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('KV read error:', e);
    }
  }
  // 降级到内存
  return memoryStore;
}

async function saveStore(env, store) {
  // 尝试 KV 存储
  if (env && env.DATA) {
    try {
      await env.DATA.put('store', JSON.stringify(store));
      return;
    } catch (e) {
      console.error('KV write error:', e);
    }
  }
  // 降级到内存
  memoryStore = store;
}

// 主入口
export default async function onRequest(context) {
  const request = context.request;
  const method = request.method;
  const env = context.env || {};
  
  // 获取路径（兼容有/无 /api 前缀）
  let pathname = new URL(request.url).pathname;
  if (pathname.startsWith('/api/')) {
    pathname = pathname.substring(4);
  }

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

  // POST /login - 登录/创建配对
  if (pathname === '/login' && method === 'POST') {
    const body = await parseBody(request);
    if (!body) return jsonError('无效的请求体');

    const { secret_code, name, role, partner_name } = body;
    if (!secret_code || secret_code.length < 6) return jsonError('暗号至少需要 6 位');
    if (!name) return jsonError('请输入名字');

    const store = await getStore(env);

    let pair = store.pairs.find(p => p.secret_code === secret_code);
    if (!pair) {
      pair = {
        pairId: 'pair_' + uuid(),
        secret_code,
        partner_name: partner_name || '',
        createdAt: new Date().toISOString()
      };
      store.pairs.push(pair);
    }
    if (partner_name && pair.partner_name !== partner_name) {
      pair.partner_name = partner_name;
    }

    let user = store.users.find(u => u.pairId === pair.pairId && u.name === name);
    if (!user) {
      user = {
        userId: 'user_' + uuid(),
        pairId: pair.pairId,
        name,
        role,
        createdAt: new Date().toISOString()
      };
      store.users.push(user);
    } else if (user.role !== role) {
      user.role = role;
    }

    const partner = store.users.find(u => u.pairId === pair.pairId && u.userId !== user.userId);
    await saveStore(env, store);

    return jsonResponse({
      token: 'token_' + uuid(),
      user_id: user.userId,
      pair_id: pair.pairId,
      user: { ...user, id: user.userId },
      pair: { ...pair, id: pair.pairId },
      partner_name: partner ? partner.name : (pair.partner_name || '')
    });
  }

  // GET /partner/:pairId/:userId
  const partnerMatch = pathname.match(/^\/partner\/([^\/]+)\/([^\/]+)$/);
  if (partnerMatch && method === 'GET') {
    const [, pairId, userId] = partnerMatch;
    const store = await getStore(env);
    const partner = store.users.find(u => u.pairId === pairId && u.userId !== userId);
    return jsonResponse({ name: partner ? partner.name : '' });
  }

  // GET /data/:pairId/:type
  const getMatch = pathname.match(/^\/data\/([^\/]+)\/([^\/]+)$/);
  if (getMatch && method === 'GET') {
    const [, pairId, type] = getMatch;
    const store = await getStore(env);
    const records = store.records
      .filter(r => r.pairId === pairId && r.type === type)
      .map(r => ({ ...r, pair_id: r.pairId }));
    return jsonResponse(records);
  }

  // POST /data/:pairId/:type
  const postMatch = pathname.match(/^\/data\/([^\/]+)\/([^\/]+)$/);
  if (postMatch && method === 'POST') {
    const [, pairId, type] = postMatch;
    const body = await parseBody(request);
    if (!body) return jsonError('无效的请求体');

    const store = await getStore(env);
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
    store.records.push(newRecord);
    await saveStore(env, store);
    return jsonResponse({ ...newRecord, pair_id: newRecord.pairId }, 201);
  }

  // PUT /data/:pairId/:type/:id
  const putMatch = pathname.match(/^\/data\/([^\/]+)\/([^\/]+)\/([^\/]+)$/);
  if (putMatch && method === 'PUT') {
    const [, pairId, type, id] = putMatch;
    const body = await parseBody(request);
    if (!body) return jsonError('无效的请求体');

    const store = await getStore(env);
    const existing = store.records.find(r => r.id === id && r.pairId === pairId && r.type === type);
    if (!existing) return jsonError('记录不存在', 404);
    Object.assign(existing, body, { updatedAt: new Date().toISOString() });
    await saveStore(env, store);
    return jsonResponse({ ...existing, pair_id: existing.pairId });
  }

  // DELETE /data/:pairId/:type/:id
  const deleteMatch = pathname.match(/^\/data\/([^\/]+)\/([^\/]+)\/([^\/]+)$/);
  if (deleteMatch && method === 'DELETE') {
    const [, pairId, type, id] = deleteMatch;
    const store = await getStore(env);
    const index = store.records.findIndex(r => r.id === id && r.pairId === pairId && r.type === type);
    if (index === -1) return jsonError('记录不存在', 404);
    store.records.splice(index, 1);
    await saveStore(env, store);
    return jsonResponse({ success: true });
  }

  return jsonError('Not Found', 404);
}
