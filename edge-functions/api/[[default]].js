// EdgeOne Edge Functions - 同檐后端 API（仅处理登录，数据存前端）

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

export default async function onRequest(context) {
  const request = context.request;
  const method = request.method;

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

    const pairId = 'pair_' + secret_code;
    const userId = 'user_' + name + '_' + pairId;

    return jsonResponse({
      token: 'token_' + uuid(),
      user_id: userId,
      pair_id: pairId,
      user: { id: userId, pairId, name, role },
      pair: { id: pairId, secret_code, partner_name: partner_name || '' },
      partner_name: partner_name || ''
    });
  }

  // GET /partner/:pairId/:userId - 获取伴侣名字
  const partnerMatch = pathname.match(/^\/partner\/([^\/]+)\/([^\/]+)$/);
  if (partnerMatch && method === 'GET') {
    return jsonResponse({ name: '' });
  }

  // 所有其他 API 返回空数据（数据由前端 localStorage 管理）
  if (pathname.startsWith('/data/')) {
    return jsonResponse([]);
  }

  return jsonError('Not Found', 404);
}
