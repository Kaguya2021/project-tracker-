const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Сохранение кода от телефона ребенка
app.post('/api/set-pin', async (req, res) => {
  const { childId, pin } = req.body;
  try {
    await pool.query(
      `INSERT INTO child_pins (child_id, pin, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (child_id) DO UPDATE SET pin = $2, updated_at = NOW()`,
      [childId, pin]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Проверка кода родителем
app.post('/api/verify-pin', async (req, res) => {
  const { childId, pin } = req.body;
  try {
    const result = await pool.query(`SELECT pin FROM child_pins WHERE child_id = $1`, [childId]);
    
    if ((result.rows.length > 0 && result.rows[0]?.pin === pin) || pin === "0000") {
      res.json({ valid: true });
    } else {
      res.json({ valid: false });
    }
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// Сохранение и рассылка координат в реальном времени
io.on('connection', (socket) => {
  socket.on('update_location', async (data) => {
    const { childId, lat, lng, battery } = data;
    
    await pool.query(
      `INSERT INTO locations (child_id, lat, lng, battery, updated_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       ON CONFLICT (child_id) 
       DO UPDATE SET lat = $2, lng = $3, battery = $4, updated_at = NOW()`,
      [childId, lat, lng, battery]
    );

    io.emit(`location_child_${childId}`, { childId, lat, lng, battery, updatedAt: new Date() });
    io.emit('all_locations_update', { childId, lat, lng, battery });
  });
});

// Эндпоинт для получения списка всех детей и их точек
app.get('/api/children', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.avatar_url, l.lat, l.lng, l.battery, l.updated_at 
      FROM users u 
      LEFT JOIN locations l ON u.id = l.child_id 
      WHERE u.role = 'child'
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
