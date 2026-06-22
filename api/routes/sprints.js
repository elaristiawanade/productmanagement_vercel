const router    = require('express').Router();
const db        = require('../config/db');
const auth      = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

router.use(auth);

router.get('/', async (req, res) => {
  const { product_id } = req.query;
  const where  = product_id ? 'WHERE s.product_id = $1' : '';
  const params = product_id ? [product_id] : [];
  try {
    const { rows } = await db.query(`
      SELECT s.*,
        COUNT(bi.id)                                         AS total_items,
        COUNT(CASE WHEN bi.status = 'todo'        THEN 1 END) AS todo,
        COUNT(CASE WHEN bi.status = 'in_progress' THEN 1 END) AS in_progress,
        COUNT(CASE WHEN bi.status = 'done'        THEN 1 END) AS done,
        COUNT(CASE WHEN bi.status = 'blocked'     THEN 1 END) AS blocked
      FROM sprints s
      LEFT JOIN backlog_items bi ON bi.sprint_id = s.id
      ${where}
      GROUP BY s.id
      ORDER BY s.start_date NULLS LAST
    `, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', checkRole('super_admin', 'manager', 'po'), async (req, res) => {
  const { product_id, name, goal, start_date, end_date, capacity } = req.body;
  if (!product_id || !name) return res.status(400).json({ error: 'product_id dan name wajib' });
  try {
    const { rows } = await db.query(
      'INSERT INTO sprints (product_id, name, goal, start_date, end_date, capacity) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [product_id, name, goal||null, start_date||null, end_date||null, capacity||0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Nama sprint sudah ada di produk ini' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sprint = await db.query('SELECT * FROM sprints WHERE id=$1', [req.params.id]);
    if (!sprint.rows[0]) return res.status(404).json({ error: 'Sprint tidak ditemukan' });

    const items = await db.query(`
      SELECT bi.id, bi.code, bi.title, bi.type, bi.priority, bi.story_points, bi.status,
             u.name AS assignee_name, u.avatar_color AS assignee_color,
             f.name AS feature_name, e.name AS epic_name
      FROM backlog_items bi
      LEFT JOIN users u    ON u.id  = bi.assignee_id
      LEFT JOIN features f ON f.id  = bi.feature_id
      LEFT JOIN epics    e ON e.id  = bi.epic_id
      WHERE bi.sprint_id = $1
      ORDER BY CASE bi.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
    `, [req.params.id]);

    res.json({ sprint: sprint.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', checkRole('super_admin', 'manager', 'po'), async (req, res) => {
  const { name, goal, start_date, end_date, capacity, committed_points, completed_points, status } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE sprints SET name=$1,goal=$2,start_date=$3,end_date=$4,capacity=$5,committed_points=$6,completed_points=$7,status=$8 WHERE id=$9 RETURNING *',
      [name, goal||null, start_date||null, end_date||null, capacity||0, committed_points||0, completed_points||0, status||'planned', req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Sprint tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', checkRole('super_admin', 'po'), async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM sprints WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Sprint tidak ditemukan' });
    res.json({ message: 'Sprint dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/burndown', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT day, ideal_remaining, actual_remaining FROM burndown_data WHERE sprint_id=$1 ORDER BY day',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/burndown', checkRole('super_admin', 'manager', 'po', 'developer'), async (req, res) => {
  const { day, actual_remaining } = req.body;
  if (day === undefined || actual_remaining === undefined) return res.status(400).json({ error: 'day dan actual_remaining wajib' });

  const sprint = await db.query('SELECT committed_points, capacity FROM sprints WHERE id=$1', [req.params.id]);
  if (!sprint.rows[0]) return res.status(404).json({ error: 'Sprint tidak ditemukan' });

  const sp   = sprint.rows[0];
  const days = 10;
  const idealRemaining = sp.committed_points - (sp.committed_points / days) * day;

  try {
    const { rows } = await db.query(
      `INSERT INTO burndown_data (sprint_id, day, ideal_remaining, actual_remaining)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (sprint_id, day) DO UPDATE SET actual_remaining=$4, ideal_remaining=$3
       RETURNING *`,
      [req.params.id, day, Math.max(0, idealRemaining), actual_remaining]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
