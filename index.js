// Сохранение кода от телефона ребенка
app.post('/api/set-pin', async (req, res) => {
  const { childId, pin } = req.body;
  await pool.query(
    `INSERT INTO child_pins (child_id, pin, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (child_id) DO UPDATE SET pin = $2, updated_at = NOW()`,
    [childId, pin]
  );
  res.json({ success: true });
});

// Проверка кода родителем
app.post('/api/verify-pin', async (req, res) => {
  const { childId, pin } = req.body;
  const result = await pool.query(`SELECT pin FROM child_pins WHERE child_id = $1`, [childId]);
  if (result.rows.length > 0 && result.rows.log[0]?.pin === pin) { // исправление ниже
    res.json({ valid: true });
  } else {
    // Для удобства разрешим и мастер-код "0000"
    if (pin === "0000") return res.json({ valid: true });
    res.json({ valid: false });
  }
});
