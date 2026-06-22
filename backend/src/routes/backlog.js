const router    = require('express').Router();
const db        = require('../config/db');
const auth      = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

router.use(auth);

const ITEM_FIELDS = `
  bi.id, bi.product_id, bi.code, bi.title, bi.type, bi.priority,
  bi.story_points, bi.status, bi.acceptance_criteria, bi.notes, bi.deadline,
  bi.created_at, bi.updated_at,
  p.name AS product_name, p.color AS product_color, p.code AS product_code,
  f.name AS feature_name, f.code AS feature_code,
  e.name AS epic_name, e.code AS epic_code,
  s.name AS sprint_name,
  u.name AS assignee_name, u.avatar_color AS assignee_color,
  CASE WHEN bi.deadline < NOW() AND bi.status NOT IN ('done','backlog') THEN true ELSE false END AS is_delayed
`;

// GET /api/backlog
router.get('/', async (req, res) => {
  const { product_id, sprint_id, status, priority, type, assignee_id, search, page = 1, limit = 50 } = req.query;
  const filters = [];
  const params  = [];
  let i = 1;

  if (product_id)  { filters.push(`bi.product_id  = $${i++}`);      params.push(product_id); }
  if (sprint_id)   { filters.push(`bi.sprint_id   = $${i++}`);      params.push(sprint_id); }
  if (status)      { filters.push(`bi.status       = ANY($${i++})`); params.push(status.split(',')); }
  if (priority)    { filters.push(`bi.priority     = ANY($${i++})`); params.push(priority.split(',')); }
  if (type)        { filters.push(`bi.type         = ANY($${i++})`); params.push(type.split(',')); }
  if (assignee_id) { filters.push(`bi.assignee_id  = $${i++}`);      params.push(assignee_id); }
  if (search)      { filters.push(`(bi.title ILIKE $${i++} OR bi.code ILIKE $${i-1})`); params.push(`%${search}%`); }

  const where  = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  try {
    const countRes = await db.query(`SELECT COUNT(*) FROM backlog_items bi ${where}`, params);
    const { rows } = await db.query(
      `SELECT ${ITEM_FIELDS}
       FROM backlog_items bi
       LEFT JOIN products p ON p.id = bi.product_id
       LEFT JOIN features f ON f.id = bi.feature_id
       LEFT JOIN epics    e ON e.id = bi.epic_id
       LEFT JOIN sprints  s ON s.id = bi.sprint_id
       LEFT JOIN users    u ON u.id = bi.assignee_id
       ${where}
       ORDER BY
         CASE bi.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         bi.created_at DESC
       LIMIT $${i} OFFSET $${i+1}`,
      [...params, limit, offset]
    );
    res.json({ items: rows, total: parseInt(countRes.rows[0].count), page: +page, limit: +limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/backlog
router.post('/', checkRole('super_admin', 'manager', 'po', 'developer'), async (req, res) => {
  const { product_id, code, title, type, feature_id, epic_id, priority, story_points, status, sprint_id, assignee_id, acceptance_criteria, notes, deadline } = req.body;
  if (!product_id || !title) return res.status(400).json({ error: 'product_id dan title wajib' });

  let itemCode = code;
  if (!itemCode) {
    const { rows } = await db.query(
      "SELECT code FROM backlog_items WHERE product_id=$1 ORDER BY code DESC LIMIT 1", [product_id]
    );
    const last = rows[0]?.code?.match(/\d+$/)?.[0] || '0';
    const { rows: pr } = await db.query('SELECT code FROM products WHERE id=$1', [product_id]);
    itemCode = `${pr[0]?.code || 'PB'}-${String(parseInt(last) + 1).padStart(3, '0')}`;
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO backlog_items
         (product_id, code, title, type, feature_id, epic_id, priority, story_points, status, sprint_id, assignee_id, acceptance_criteria, notes, deadline, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id, code`,
      [product_id, itemCode, title, type||'story', feature_id||null, epic_id||null, priority||'medium', story_points||0, status||'backlog', sprint_id||null, assignee_id||null, acceptance_criteria||null, notes||null, deadline||null, req.user.id]
    );
    const detail = await db.query(
      `SELECT ${ITEM_FIELDS} FROM backlog_items bi LEFT JOIN products p ON p.id=bi.product_id LEFT JOIN features f ON f.id=bi.feature_id LEFT JOIN epics e ON e.id=bi.epic_id LEFT JOIN sprints s ON s.id=bi.sprint_id LEFT JOIN users u ON u.id=bi.assignee_id WHERE bi.id=$1`,
      [rows[0].id]
    );
    res.status(201).json(detail.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Kode item sudah ada' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/backlog/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ${ITEM_FIELDS} FROM backlog_items bi LEFT JOIN products p ON p.id=bi.product_id LEFT JOIN features f ON f.id=bi.feature_id LEFT JOIN epics e ON e.id=bi.epic_id LEFT JOIN sprints s ON s.id=bi.sprint_id LEFT JOIN users u ON u.id=bi.assignee_id WHERE bi.id=$1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Item tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/backlog/:id
router.put('/:id', checkRole('super_admin', 'manager', 'po', 'developer', 'qa'), async (req, res) => {
  const { title, type, feature_id, epic_id, priority, story_points, status, sprint_id, assignee_id, acceptance_criteria, notes, deadline } = req.body;
  try {
    await db.query(
      `UPDATE backlog_items SET title=$1,type=$2,feature_id=$3,epic_id=$4,priority=$5,story_points=$6,status=$7,sprint_id=$8,assignee_id=$9,acceptance_criteria=$10,notes=$11,deadline=$12 WHERE id=$13`,
      [title,type,feature_id||null,epic_id||null,priority,story_points||0,status,sprint_id||null,assignee_id||null,acceptance_criteria||null,notes||null,deadline||null,req.params.id]
    );
    const detail = await db.query(
      `SELECT ${ITEM_FIELDS} FROM backlog_items bi LEFT JOIN products p ON p.id=bi.product_id LEFT JOIN features f ON f.id=bi.feature_id LEFT JOIN epics e ON e.id=bi.epic_id LEFT JOIN sprints s ON s.id=bi.sprint_id LEFT JOIN users u ON u.id=bi.assignee_id WHERE bi.id=$1`,
      [req.params.id]
    );
    if (!detail.rows[0]) return res.status(404).json({ error: 'Item tidak ditemukan' });
    res.json(detail.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/backlog/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status wajib' });
  try {
    const { rows } = await db.query(
      'UPDATE backlog_items SET status=$1 WHERE id=$2 RETURNING id, status',
      [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Item tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/backlog/:id
router.delete('/:id', checkRole('super_admin', 'manager', 'po'), async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM backlog_items WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Item tidak ditemukan' });
    res.json({ message: 'Item dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
