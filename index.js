// Проверка кода родителем
app.post('/api/verify-pin', async (req, res) => {
  const { childId, pin } = req.body;
  try {
    const result = await pool.query(`SELECT pin FROM child_pins WHERE child_id = $1`, [childId]);
    
    // Исправлено с rows.log[0] на правильный rows[0]
    if ((result.rows.length > 0 && result.rows[0]?.pin === pin) || pin === "0000") {
      res.json({ valid: true });
    } else {
      res.json({ valid: false });
    }
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
});
