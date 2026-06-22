const router    = require('express').Router();
const db        = require('../config/db');
const auth      = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

router.use(auth);

// ─── TEST CASES ───────────────────────────────────────────────────────────────

router.get('/test-cases', async (req, res) => {
  const { product_id, backlog_item_id, status } = req.query;
  const filters = []; const params = []; let i = 1;
  if (product_id)      { filters.push(`tc.product_id = $${i++}`);       params.push(product_id); }
  if (backlog_item_id) { filters.push(`tc.backlog_item_id = $${i++}`);  params.push(backlog_item_id); }
  if (status)          { filters.push(`tc.status = $${i++}`);           params.push(status); }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  try {
    const { rows } = await db.query(`
      SELECT tc.*,
        bi.code AS item_code, bi.title AS item_title,
        p.name AS product_name, p.code AS product_code,
        u.name AS created_by_name,
        COUNT(tr.id)                                   AS run_count,
        COUNT(CASE WHEN tr.result='pass'  THEN 1 END)  AS pass_count,
        COUNT(CASE WHEN tr.result='fail'  THEN 1 END)  AS fail_count,
        MAX(tr.executed_at)                            AS last_run
      FROM qa_test_cases tc
      LEFT JOIN backlog_items bi ON bi.id = tc.backlog_item_id
      LEFT JOIN products      p  ON p.id  = tc.product_id
      LEFT JOIN users         u  ON u.id  = tc.created_by
      LEFT JOIN qa_test_runs  tr ON tr.test_case_id = tc.id
      ${where}
      GROUP BY tc.id, bi.code, bi.title, p.name, p.code, u.name
      ORDER BY tc.product_id, tc.code
    `, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/test-cases', checkRole('super_admin', 'manager', 'qa', 'po'), async (req, res) => {
  const { backlog_item_id, product_id, code, title, description, steps, expected_result, status, priority } = req.body;
  if (!backlog_item_id || !title) return res.status(400).json({ error: 'backlog_item_id dan title wajib' });

  let tcCode = code;
  if (!tcCode) {
    const { rows } = await db.query(
      "SELECT code FROM qa_test_cases WHERE product_id=$1 ORDER BY id DESC LIMIT 1", [product_id]
    );
    const last = rows[0]?.code?.match(/\d+$/)?.[0] || '0';
    tcCode = `TC-${String(parseInt(last) + 1).padStart(3, '0')}`;
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO qa_test_cases (backlog_item_id, product_id, code, title, description, steps, expected_result, status, priority, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [backlog_item_id, product_id, tcCode, title, description||null, steps||null, expected_result||null, status||'draft', priority||'medium', req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/test-cases/:id', checkRole('super_admin', 'manager', 'qa', 'po'), async (req, res) => {
  const { title, description, steps, expected_result, status, priority } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE qa_test_cases SET title=$1,description=$2,steps=$3,expected_result=$4,status=$5,priority=$6 WHERE id=$7 RETURNING *',
      [title, description||null, steps||null, expected_result||null, status, priority, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Test case tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/test-cases/:id', checkRole('super_admin', 'qa'), async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM qa_test_cases WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Test case tidak ditemukan' });
    res.json({ message: 'Test case dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── TEST RUNS ────────────────────────────────────────────────────────────────

router.get('/test-runs', async (req, res) => {
  const { sprint_id, test_case_id, product_id } = req.query;
  const filters = []; const params = []; let i = 1;
  if (sprint_id)    { filters.push(`tr.sprint_id = $${i++}`);     params.push(sprint_id); }
  if (test_case_id) { filters.push(`tr.test_case_id = $${i++}`);  params.push(test_case_id); }
  if (product_id)   { filters.push(`tc.product_id = $${i++}`);    params.push(product_id); }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  try {
    const { rows } = await db.query(`
      SELECT tr.*, tc.code AS tc_code, tc.title AS tc_title,
        bi.code AS item_code, bi.title AS item_title,
        u.name AS tester_name, s.name AS sprint_name
      FROM qa_test_runs tr
      JOIN qa_test_cases tc ON tc.id = tr.test_case_id
      JOIN backlog_items bi ON bi.id = tc.backlog_item_id
      LEFT JOIN users   u   ON u.id  = tr.tester_id
      LEFT JOIN sprints s   ON s.id  = tr.sprint_id
      ${where}
      ORDER BY tr.created_at DESC
    `, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/test-runs', checkRole('super_admin', 'manager', 'qa'), async (req, res) => {
  const { test_case_id, sprint_id, result, notes, bug_reference } = req.body;
  if (!test_case_id) return res.status(400).json({ error: 'test_case_id wajib' });
  try {
    const { rows } = await db.query(
      `INSERT INTO qa_test_runs (test_case_id, sprint_id, tester_id, result, notes, bug_reference, executed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [test_case_id, sprint_id||null, req.user.id, result||'pending', notes||null, bug_reference||null,
       result !== 'pending' ? new Date() : null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/test-runs/:id', checkRole('super_admin', 'manager', 'qa'), async (req, res) => {
  const { result, notes, bug_reference } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE qa_test_runs SET result=$1,notes=$2,bug_reference=$3,executed_at=$4,tester_id=$5 WHERE id=$6 RETURNING *',
      [result, notes||null, bug_reference||null, result!=='pending'?new Date():null, req.user.id, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Test run tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── QA DASHBOARD ─────────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  const { product_id } = req.query;
  const productFilter  = product_id ? 'AND tc.product_id = $1' : '';
  const params         = product_id ? [product_id] : [];

  try {
    const summary = await db.query(`
      SELECT
        COUNT(DISTINCT tc.id) AS total_cases,
        COUNT(DISTINCT CASE WHEN tc.status='active' THEN tc.id END) AS active_cases,
        COUNT(tr.id) AS total_runs,
        COUNT(CASE WHEN tr.result='pass'    THEN 1 END) AS pass_count,
        COUNT(CASE WHEN tr.result='fail'    THEN 1 END) AS fail_count,
        COUNT(CASE WHEN tr.result='blocked' THEN 1 END) AS blocked_count,
        COUNT(CASE WHEN tr.result='pending' THEN 1 END) AS pending_count,
        ROUND(100.0 * COUNT(CASE WHEN tr.result='pass' THEN 1 END) /
          NULLIF(COUNT(CASE WHEN tr.result IN('pass','fail') THEN 1 END), 0), 1) AS pass_rate
      FROM qa_test_cases tc
      LEFT JOIN qa_test_runs tr ON tr.test_case_id = tc.id
      WHERE 1=1 ${productFilter}
    `, params);

    const byProduct = await db.query(`
      SELECT p.name AS product, p.color,
        COUNT(DISTINCT tc.id) AS total_cases,
        COUNT(CASE WHEN tr.result='pass' THEN 1 END) AS pass_count,
        COUNT(CASE WHEN tr.result='fail' THEN 1 END) AS fail_count
      FROM products p
      LEFT JOIN qa_test_cases tc ON tc.product_id = p.id
      LEFT JOIN qa_test_runs  tr ON tr.test_case_id = tc.id
      GROUP BY p.id, p.name, p.color
      ORDER BY p.id
    `);

    const bySprint = await db.query(`
      SELECT s.name AS sprint, s.product_id,
        COUNT(CASE WHEN tr.result='pass'    THEN 1 END) AS pass_count,
        COUNT(CASE WHEN tr.result='fail'    THEN 1 END) AS fail_count,
        COUNT(CASE WHEN tr.result='blocked' THEN 1 END) AS blocked_count
      FROM sprints s
      LEFT JOIN qa_test_runs tr ON tr.sprint_id = s.id
      GROUP BY s.id, s.name, s.product_id
      ORDER BY s.start_date NULLS LAST
      LIMIT 12
    `);

    const recentFails = await db.query(`
      SELECT tr.id, tr.result, tr.notes, tr.bug_reference, tr.executed_at,
        tc.code AS tc_code, tc.title AS tc_title,
        bi.code AS item_code, bi.title AS item_title,
        p.name AS product, u.name AS tester
      FROM qa_test_runs tr
      JOIN qa_test_cases tc ON tc.id = tr.test_case_id
      JOIN backlog_items bi ON bi.id = tc.backlog_item_id
      JOIN products      p  ON p.id  = tc.product_id
      LEFT JOIN users    u  ON u.id  = tr.tester_id
      WHERE tr.result = 'fail'
      ORDER BY tr.executed_at DESC NULLS LAST
      LIMIT 10
    `);

    res.json({ summary: summary.rows[0], byProduct: byProduct.rows, bySprint: bySprint.rows, recentFails: recentFails.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
