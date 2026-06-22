module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.permissions?.all) return next(); // super_admin bypass
  if (allowedRoles.includes(req.user.role_name)) return next();
  res.status(403).json({ error: 'Akses ditolak. Role tidak memiliki izin.' });
};
