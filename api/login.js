const { checkPassword, setSessionCookie } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) { res.status(500).json({ error: 'Admin panel is not configured yet (missing ADMIN_PASSWORD)' }); return; }
  if (!password || !checkPassword(password)) { res.status(401).json({ error: 'Incorrect password' }); return; }
  setSessionCookie(res);
  res.status(200).json({ ok: true });
};
