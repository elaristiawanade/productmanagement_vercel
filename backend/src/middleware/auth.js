const jwt = require('jsonwebtoken');
const db  = require('../config/db');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query(
      'SELECT u.id, u.name, u.email, u.role_id, u.is_active, r.name AS role_name, r.permissions FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.id = $1',
      [payload.userId]
    );
    if (!rows[0] || !rows[0].is_active) {
      return res.status(401).json({ error: 'User tidak aktif atau tidak ditemukan' });
    }
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid' });
  }
};
