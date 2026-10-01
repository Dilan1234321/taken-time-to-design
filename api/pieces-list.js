const { isAuthenticated } = require('../lib/auth');
const { getFile } = require('../lib/github');

module.exports = async (req, res) => {
  if (!isAuthenticated(req)) { res.status(401).json({ error: 'Not authenticated' }); return; }
  try {
    const { json } = await getFile('data/pieces.json');
    const pieces = Array.isArray(json) ? json : [];
    pieces.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.status(200).json({ pieces });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
