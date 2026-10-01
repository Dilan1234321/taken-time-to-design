const { isAuthenticated } = require('../lib/auth');
const { getFile, putFile } = require('../lib/github');

const PATH = 'data/pieces.json';
const VALID_CATEGORIES = new Set(['portrait', 'pet', 'figure', 'painting', 'caricature']);

function nextId(rows) {
  const ids = rows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n));
  return (ids.length ? Math.max(...ids) : 0) + 1;
}

function nextOrder(rows) {
  const orders = rows.map((r) => Number(r.order)).filter((n) => Number.isFinite(n));
  return (orders.length ? Math.max(...orders) : 0) + 1;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  if (!isAuthenticated(req)) { res.status(401).json({ error: 'Not authenticated' }); return; }

  const { action, item, order } = req.body || {};
  if (!['upsert', 'delete', 'reorder'].includes(action)) { res.status(400).json({ error: 'Unknown action' }); return; }

  try {
    const { json, sha } = await getFile(PATH);
    const list = Array.isArray(json) ? json : [];
    let updated;
    let commitMessage;
    let savedItem;

    if (action === 'delete') {
      if (item == null || item.id == null) { res.status(400).json({ error: 'Missing id' }); return; }
      updated = list.filter((r) => String(r.id) !== String(item.id));
      commitMessage = 'Delete piece via admin panel';
    } else if (action === 'reorder') {
      if (!Array.isArray(order)) { res.status(400).json({ error: 'Missing order array of ids' }); return; }
      const byId = new Map(list.map((r) => [String(r.id), r]));
      updated = order
        .map((id, idx) => {
          const row = byId.get(String(id));
          if (!row) return null;
          return { ...row, order: idx + 1 };
        })
        .filter(Boolean);
      // append anything not included in the provided order, preserving relative order
      const includedIds = new Set(order.map(String));
      list.forEach((row) => {
        if (!includedIds.has(String(row.id))) updated.push(row);
      });
      commitMessage = 'Reorder pieces via admin panel';
    } else {
      if (!item || typeof item !== 'object') { res.status(400).json({ error: 'Missing item' }); return; }
      if (!item.title || !item.medium || !item.image) { res.status(400).json({ error: 'Title, medium, and image are required' }); return; }
      const categories = Array.isArray(item.categories) ? item.categories.filter((c) => VALID_CATEGORIES.has(c)) : [];
      if (categories.length === 0) { res.status(400).json({ error: 'Pick at least one category' }); return; }

      const saved = {
        title: String(item.title).trim(),
        medium: String(item.medium).trim(),
        categories,
        image: String(item.image).trim(),
        alt: item.alt ? String(item.alt).trim() : String(item.title).trim(),
      };

      const idx = list.findIndex((r) => String(r.id) === String(item.id));
      if (idx === -1) {
        saved.id = nextId(list);
        saved.order = nextOrder(list);
        updated = [...list, saved];
        commitMessage = `Add piece "${saved.title}" via admin panel`;
      } else {
        saved.id = list[idx].id;
        saved.order = list[idx].order;
        updated = [...list];
        updated[idx] = saved;
        commitMessage = `Update piece "${saved.title}" via admin panel`;
      }
      savedItem = saved;
    }

    updated.sort((a, b) => (a.order || 0) - (b.order || 0));
    await putFile(PATH, JSON.stringify(updated, null, 2), sha, commitMessage);
    res.status(200).json({ ok: true, item: savedItem, pieces: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
