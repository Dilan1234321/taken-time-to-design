const { isAuthenticated } = require('../lib/auth');
const { getFileSha, putFileBase64 } = require('../lib/github');

const ALLOWED_TYPES = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'piece';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  if (!isAuthenticated(req)) { res.status(401).json({ error: 'Not authenticated' }); return; }

  const { filename, dataUrl } = req.body || {};
  if (!dataUrl || typeof dataUrl !== 'string') { res.status(400).json({ error: 'Missing image data' }); return; }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) { res.status(400).json({ error: 'Invalid image data' }); return; }
  const [, mimeType, base64] = match;
  const ext = ALLOWED_TYPES[mimeType];
  if (!ext) { res.status(400).json({ error: 'Only JPEG, PNG, or WEBP images are supported' }); return; }

  const approxBytes = (base64.length * 3) / 4;
  if (approxBytes > 4 * 1024 * 1024) { res.status(413).json({ error: 'Image is too large (max 4MB)' }); return; }

  try {
    const base = slugify(filename || 'piece');
    let candidate = `${base}.${ext}`;
    let i = 1;
    while ((await getFileSha(`images/${candidate}`)).sha) {
      i += 1;
      candidate = `${base}-${i}.${ext}`;
    }
    const path = `images/${candidate}`;
    await putFileBase64(path, base64, null, `Upload image ${candidate} via admin panel`);
    res.status(200).json({ ok: true, path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
