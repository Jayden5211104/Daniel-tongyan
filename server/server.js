const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, 'data.json');

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

let { pairs, users, records } = loadFromFile();

console.log(`[DATA INIT] Loaded ${pairs.length} pairs, ${users.length} users, ${Object.values(records).reduce((s, a) => s + a.length, 0)} records`);

app.post('/api/login', (req, res) => {
  const { secret_code, name, role, partner_name } = req.body;

  if (!secret_code || secret_code.length < 6) {
    return res.status(400).json({ error: '暗号至少需要6位' });
  }
  if (!name) {
    return res.status(400).json({ error: '请输入名字' });
  }

  let pair = pairs.find(p => p.secret_code === secret_code);
  
  if (!pair) {
    pair = {
      id: `pair_${uuidv4()}`,
      secret_code: secret_code,
      partner_name: partner_name || '',
      created_at: new Date().toISOString()
    };
    pairs.push(pair);
    console.log(`[CREATE PAIR] ${pair.id} for secret_code: ${secret_code}`);
    saveToFile();
  }

  // 更新 partner_name（如果提供了）
  if (partner_name && pair.partner_name !== partner_name) {
    pair.partner_name = partner_name;
    saveToFile();
  }

  let user = users.find(u => u.pair_id === pair.id && u.name === name);
  
  if (!user) {
    user = {
      id: `user_${uuidv4()}`,
      pair_id: pair.id,
      name: name,
      role: role,
      created_at: new Date().toISOString()
    };
    users.push(user);
    console.log(`[CREATE USER] ${user.id} (${user.name}) in pair ${pair.id}`);
    saveToFile();
  } else if (user.role !== role) {
    user.role = role;
    saveToFile();
  }

  // 查找伴侣
  const partner = users.find(u => u.pair_id === pair.id && u.id !== user.id);

  const token = `token_${uuidv4()}`;
  
  console.log(`[LOGIN SUCCESS] User: ${user.name}, Pair ID: ${pair.id}, Role: ${role}`);
  
  res.json({
    token: token,
    user_id: user.id,
    pair_id: pair.id,
    user: user,
    pair: pair,
    partner_name: partner ? partner.name : (pair.partner_name || '')
  });
});

app.get('/api/partner/:pairId/:userId', (req, res) => {
  const { pairId, userId } = req.params;
  const partner = users.find(u => u.pair_id === pairId && u.id !== userId);
  if (partner) {
    res.json({ name: partner.name });
  } else {
    res.json({ name: '' });
  }
});

app.get('/api/data/:pairId/:type', (req, res) => {
  const { pairId, type } = req.params;
  const data = records[type] || [];
  const filtered = data.filter(item => item.pair_id === pairId);
  console.log(`[QUERY DATA] Pair ID: ${pairId}, Type: ${type}, Count: ${filtered.length}`);
  res.json(filtered);
});

app.post('/api/data/:pairId/:type', (req, res) => {
  const { pairId, type } = req.params;
  const item = req.body;
  
  if (!records[type]) {
    records[type] = [];
  }
  
  const newItem = {
    ...item,
    id: `item_${Date.now()}`,
    pair_id: pairId,
    created_at: new Date().toISOString()
  };
  
  records[type].push(newItem);
  saveToFile();
  
  console.log(`[CREATE DATA] Pair ID: ${pairId}, Type: ${type}, ID: ${newItem.id}`);
  res.json(newItem);
});

app.put('/api/data/:pairId/:type/:id', (req, res) => {
  const { pairId, type, id } = req.params;
  const updates = req.body;
  
  if (!records[type]) {
    return res.status(404).json({ error: 'Type not found' });
  }
  
  const index = records[type].findIndex(item => item.id === id && item.pair_id === pairId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  records[type][index] = {
    ...records[type][index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  saveToFile();
  
  console.log(`[UPDATE DATA] Pair ID: ${pairId}, Type: ${type}, ID: ${id}`);
  res.json(records[type][index]);
});

app.delete('/api/data/:pairId/:type/:id', (req, res) => {
  const { pairId, type, id } = req.params;
  
  if (!records[type]) {
    return res.status(404).json({ error: 'Type not found' });
  }
  
  const initialLength = records[type].length;
  records[type] = records[type].filter(item => !(item.id === id && item.pair_id === pairId));
  
  if (records[type].length === initialLength) {
    return res.status(404).json({ error: 'Item not found' });
  }
  saveToFile();
  
  console.log(`[DELETE DATA] Pair ID: ${pairId}, Type: ${type}, ID: ${id}`);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
