const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

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

let { pairs, users, records } = loadFromFile();

app.post('/api/login', (req, res) => {
  const { secret_code, name, role } = req.body;
  if (!secret_code || secret_code.length < 6) return res.status(400).json({ error: '暗号至少需要6位' });
  if (!name) return res.status(400).json({ error: '请输入名字' });

  let pair = pairs.find(p => p.secret_code === secret_code);
  if (!pair) {
    pair = { id: `pair_${uuidv4()}`, secret_code, created_at: new Date().toISOString() };
    pairs.push(pair);
    saveToFile();
  }

  let user = users.find(u => u.pair_id === pair.id && u.name === name);
  if (!user) {
    user = { id: `user_${uuidv4()}`, pair_id: pair.id, name, role, created_at: new Date().toISOString() };
    users.push(user);
    saveToFile();
  } else if (user.role !== role) {
    user.role = role;
    saveToFile();
  }

  res.json({ token: `token_${uuidv4()}`, user_id: user.id, pair_id: pair.id, user, pair });
});

app.get('/api/partner/:pairId/:userId', (req, res) => {
  const { pairId, userId } = req.params;
  const partner = users.find(u => u.pair_id === pairId && u.id !== userId);
  res.json({ name: partner ? partner.name : '' });
});

app.get('/api/data/:pairId/:type', (req, res) => {
  const { pairId, type } = req.params;
  const data = records[type] || [];
  res.json(data.filter(item => item.pair_id === pairId));
});

app.post('/api/data/:pairId/:type', (req, res) => {
  const { pairId, type } = req.params;
  const item = req.body;
  if (!records[type]) records[type] = [];
  const newItem = { ...item, id: `item_${Date.now()}`, pair_id: pairId, created_at: new Date().toISOString() };
  records[type].push(newItem);
  saveToFile();
  res.json(newItem);
});

app.put('/api/data/:pairId/:type/:id', (req, res) => {
  const { pairId, type, id } = req.params;
  if (!records[type]) return res.status(404).json({ error: 'Type not found' });
  const index = records[type].findIndex(item => item.id === id && item.pair_id === pairId);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });
  records[type][index] = { ...records[type][index], ...req.body, updated_at: new Date().toISOString() };
  saveToFile();
  res.json(records[type][index]);
});

app.delete('/api/data/:pairId/:type/:id', (req, res) => {
  const { pairId, type, id } = req.params;
  if (!records[type]) return res.status(404).json({ error: 'Type not found' });
  const initialLength = records[type].length;
  records[type] = records[type].filter(item => !(item.id === id && item.pair_id === pairId));
  if (records[type].length === initialLength) return res.status(404).json({ error: 'Item not found' });
  saveToFile();
  res.json({ success: true });
});

module.exports = app;
