const { getFile } = require('../lib/github');

module.exports = async (req, res) => {
  try {
    const { json } = await getFile('data/pieces.json');
    const pieces = Array.isArray(json) ? json : [];
    pieces.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    res.status(200).json({ pieces });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
