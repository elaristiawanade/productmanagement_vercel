const router    = require('express').Router();
const db        = require('../config/db');
const auth      = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

router.use(auth);

// GET /api/epics?product_id=
router.get('/', async (req, res) => {
  const { product_id } = req.query;
  const where = product_id ? 'WHERE e.product_id = $1' : '';
  const params = product_id ? [product_id] : [];
  try {
    const { rows } = await db.query(`
      SELECT e.*, u.name AS created_by_name,
        COUNT(bi.id) AS item_count,
        COALESCE(SUM(bi.story_points), 0) AS total_points,
        COALESCE(SUM(CASE WHEN bi.status='done' THEN bi.story_points ELSE 0 END), 0) AS done_points
      FROM epics e
      LEFT JOIN users u ON u.id = e.created_by
      LEFT JOIN backlog_items bi ON bi.epic_id = e.id
      ${where}
      GROUP BY e.id, u.name
      ORDER BY e.product_id, e.code
    `, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/epics
router.post('/', checkRole('super_admin', 'manager', 'po'), async (req, res) => {
  const { product_id, code, name, description, status, priority } = req.body;
  if (!product_id || !code || !name) return res.status(400).json({ error: 'product_id, code, name wajib' });
  try {
    const { rows } = await db.query(
      'INSERT INTO epics (product_id, code, name, description, status, priority, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [product_id, code, name, description, status || 'open', priority || 'medium', req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Kode epic sudah ada di produk ini' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/epics/:id
router.put('/:id', checkRole('super_admin', 'manager', 'po'), async (req, res) => {
  const { name, description, status, priority } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE epics SET name=$1, description=$2, status=$3, priority=$4 WHERE id=$5 RETURNING *',
      [name, description, status, priority, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Epic tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/epics/:id
router.delete('/:id', checkRole('super_admin', 'po'), async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM epics WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Epic tidak ditemukan' });
    res.json({ message: 'Epic dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
