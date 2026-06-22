const router    = require('express').Router();
const db        = require('../config/db');
const auth      = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

router.use(auth);

router.get('/', async (req, res) => {
  const { product_id } = req.query;
  const where = product_id ? 'WHERE f.product_id = $1' : '';
  const params = product_id ? [product_id] : [];
  try {
    const { rows } = await db.query(`
      SELECT f.*, u.name AS owner_name, e.name AS epic_name,
        COUNT(bi.id) AS item_count,
        COALESCE(SUM(bi.story_points), 0) AS total_points,
        COALESCE(SUM(CASE WHEN bi.status='done' THEN bi.story_points ELSE 0 END), 0) AS done_points
      FROM features f
      LEFT JOIN users u  ON u.id  = f.owner_id
      LEFT JOIN epics e  ON e.id  = f.epic_id
      LEFT JOIN backlog_items bi ON bi.feature_id = f.id
      ${where}
      GROUP BY f.id, u.name, e.name
      ORDER BY f.product_id, f.code
    `, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', checkRole('super_admin', 'manager', 'po'), async (req, res) => {
  const { product_id, epic_id, code, name, owner_id, status, priority, target_release } = req.body;
  if (!product_id || !code || !name) return res.status(400).json({ error: 'product_id, code, name wajib' });
  try {
    const { rows } = await db.query(
      'INSERT INTO features (product_id, epic_id, code, name, owner_id, status, priority, target_release) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [product_id, epic_id || null, code, name, owner_id || null, status || 'not_started', priority || 'medium', target_release || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Kode feature sudah ada di produk ini' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', checkRole('super_admin', 'manager', 'po'), async (req, res) => {
  const { name, epic_id, owner_id, status, priority, target_release } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE features SET name=$1, epic_id=$2, owner_id=$3, status=$4, priority=$5, target_release=$6 WHERE id=$7 RETURNING *',
      [name, epic_id || null, owner_id || null, status, priority, target_release || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Feature tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', checkRole('super_admin', 'po'), async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM features WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Feature tidak ditemukan' });
    res.json({ message: 'Feature dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
