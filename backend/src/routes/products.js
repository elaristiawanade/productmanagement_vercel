const router    = require('express').Router();
const db        = require('../config/db');
const auth      = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

router.use(auth);

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, u.name AS owner_name,
        (SELECT COUNT(*) FROM backlog_items bi WHERE bi.product_id = p.id)                             AS total_items,
        (SELECT COUNT(*) FROM backlog_items bi WHERE bi.product_id = p.id AND bi.status = 'done')      AS done_items,
        (SELECT COUNT(*) FROM sprints s WHERE s.product_id = p.id AND s.status = 'active')            AS active_sprints
      FROM products p
      LEFT JOIN users u ON u.id = p.owner_id
      ORDER BY p.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products
router.post('/', checkRole('super_admin', 'manager'), async (req, res) => {
  const { code, name, description, status, owner_id, repository_url, color } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'Code dan name wajib diisi' });
  try {
    const { rows } = await db.query(
      'INSERT INTO products (code, name, description, status, owner_id, repository_url, color) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [code.toUpperCase(), name, description, status || 'active', owner_id || null, repository_url || null, color || '#4F46E5']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Kode produk sudah digunakan' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, u.name AS owner_name FROM products p LEFT JOIN users u ON u.id = p.owner_id WHERE p.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/products/:id
router.put('/:id', checkRole('super_admin', 'manager', 'po'), async (req, res) => {
  const { name, description, status, owner_id, repository_url, color } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE products SET name=$1, description=$2, status=$3, owner_id=$4, repository_url=$5, color=$6 WHERE id=$7 RETURNING *',
      [name, description, status, owner_id || null, repository_url || null, color, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', checkRole('super_admin'), async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json({ message: 'Produk dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
