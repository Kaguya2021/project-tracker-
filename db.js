const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Инициализация таблиц
const initDb = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      role VARCHAR(10) NOT NULL, -- 'parent' или 'child'
      avatar_url TEXT
    );

    CREATE TABLE IF NOT EXISTS locations (
      child_id INT REFERENCES users(id),
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      battery INT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (child_id)
    );

    CREATE TABLE IF NOT EXISTS child_pins (
      child_id INT PRIMARY KEY,
      pin VARCHAR(4),
      updated_at TIMESTAMP
    );
  `;
  await pool.query(query);
};

initDb().catch(console.error);

module.exports = pool;
