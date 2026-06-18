// EdgeOne Cloud Functions - 同檐后端 API
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

function loadFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[DATA LOAD ERROR]', e.message);
  }
  return { pairs: [], users: [], records: { bills: [], budgets: [], shopping: [], dreams: [], emotions: [], anniversaries: [], affirmations: [], chores: [], inventory: [], travel: [], recipes: [], calendar_events: [], tasks: [] } };
}

function saveToFile() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ pairs, users, records }, null, 2), 'utf-8');
  } catch (e) {
    console.error('[DATA SAVE ERROR]', e.message);
  }
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

let { pairs, users, records } = loadFromFile();

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
    return {};
  }
}

function parsePath(url) {
  const pathname = new URL(url).pathname;
  return pathname;
}

export default async function onRequest(context) {
  const request = context.request;
  const method = request.method;
  const pathname = parsePath(request.url);

  // CORS preflight
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

  // POST /api/login
  if (method === 'POST' && pathname === '/api/login') {
    const body = await parseBody(request);
    const { secret_code, name, role } = body;
    if (!secret_code || secret_code.length < 6) return jsonError('暗号至少需要6位');
    if (!name) return jsonError('请输入名字');

    let pair = pairs.find(p => p.secret_code === secret_code);
    if (!pair) {
      pair = { id: `pair_${uuid()}`, secret_code, created_at: new Date().toISOString() };
      pairs.push(pair);
      saveToFile();
    }

    let user = users.find(u => u.pair_id === pair.id && u.name === name);
    if (!user) {
      user = { id: `user_${uuid()}`, pair_id: pair.id, name, role, created_at: new Date().toISOString() };
      users.push(user);
      saveToFile();
    } else if (user.role !== role) {
      user.role = role;
      saveToFile();
    }

    return jsonResponse({ token: `token_${uuid()}`, user_id: user.id, pair_id: pair.id, user, pair });
  }

  // GET /api/partner/:pairId/:userId
  const partnerMatch = pathname.match(/^\/api\/partner\/([^/]+)\/([^/]+)$/);
  if (method === 'GET' && partnerMatch) {
    const [, pairId, userId] = partnerMatch;
    const partner = users.find(u => u.pair_id === pairId && u.id !== userId);
    return jsonResponse({ name: partner ? partner.name : '' });
  }

  // GET /api/data/:pairId/:type
  const dataGetMatch = pathname.match(/^\/api\/data\/([^/]+)\/([^/]+)$/);
  if (method === 'GET' && dataGetMatch) {
    const [, pairId, type] = dataGetMatch;
    const data = records[type] || [];
    return jsonResponse(data.filter(item => item.pair_id === pairId));
  }

  // POST /api/data/:pairId/:type
  if (method === 'POST' && dataGetMatch) {
    const [, pairId, type] = dataGetMatch;
    const item = await parseBody(request);
    if (!records[type]) records[type] = [];
    const newItem = { ...item, id: `item_${Date.now()}`, pair_id: pairId, created_at: new Date().toISOString() };
    records[type].push(newItem);
    saveToFile();
    return jsonResponse(newItem);
  }

  // PUT /api/data/:pairId/:type/:id
  const dataPutMatch = pathname.match(/^\/api\/data\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (method === 'PUT' && dataPutMatch) {
    const [, pairId, type, id] = dataPutMatch;
    if (!records[type]) return jsonError('Type not found', 404);
    const index = records[type].findIndex(item => item.id === id && item.pair_id === pairId);
    if (index === -1) return jsonError('Item not found', 404);
    const updates = await parseBody(request);
    records[type][index] = { ...records[type][index], ...updates, updated_at: new Date().toISOString() };
    saveToFile();
    return jsonResponse(records[type][index]);
  }

  // DELETE /api/data/:pairId/:type/:id
  if (method === 'DELETE' && dataPutMatch) {
    const [, pairId, type, id] = dataPutMatch;
    if (!records[type]) return jsonError('Type not found', 404);
    const initialLength = records[type].length;
    records[type] = records[type].filter(item => !(item.id === id && item.pair_id === pairId));
    if (records[type].length === initialLength) return jsonError('Item not found', 404);
    saveToFile();
    return jsonResponse({ success: true });
  }

  return jsonError('Not Found', 404);
}
