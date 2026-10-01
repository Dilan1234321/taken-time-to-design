const OWNER = 'Dilan1234321';
const REPO = 'taken-time-to-design';
const BRANCH = 'main';
const API_BASE = 'https://api.github.com';

function authHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not configured');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ttd-admin-panel',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function getFile(path) {
  const res = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, { headers: authHeaders() });
  if (res.status === 404) return { json: null, sha: null };
  if (!res.ok) throw new Error(`GitHub getFile ${path} failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { json: JSON.parse(content), sha: data.sha };
}

async function getFileSha(path) {
  const res = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, { headers: authHeaders() });
  if (res.status === 404) return { sha: null };
  if (!res.ok) throw new Error(`GitHub getFileSha ${path} failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { sha: data.sha };
}

async function putFileBase64(path, base64Content, sha, message) {
  const body = { message, content: base64Content, branch: BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub putFile ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function putFile(path, contentString, sha, message) {
  return putFileBase64(path, Buffer.from(contentString, 'utf-8').toString('base64'), sha, message);
}

async function deleteFile(path, sha, message) {
  const res = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) throw new Error(`GitHub deleteFile ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

module.exports = { getFile, getFileSha, putFile, putFileBase64, deleteFile, OWNER, REPO, BRANCH };
