// Jils Sweet 16 – Cloudflare Worker
// Liefert die Website aus /public aus und stellt unter /api die Datenbank (D1) bereit.

const SECTIONS = ['meta', 'loc', 'guests', 'tasks', 'drinks', 'gear', 'costs', 'tl', 'songs', 'mood'];
const MAX_SECTION_BYTES = 512 * 1024;      // 512 KB Text pro Bereich
const MAX_IMAGE_BYTES = 1.8 * 1024 * 1024; // D1 erlaubt max. 2 MB pro Zeile

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// Passwort-Vergleich ohne Zeit-Leck
function sameSecret(a, b) {
  const x = new TextEncoder().encode(a || '');
  const y = new TextEncoder().encode(b || '');
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function authorized(req, env) {
  if (!env.EDIT_KEY) return true; // kein Passwort gesetzt -> offen
  return sameSecret(req.headers.get('x-party-key'), env.EDIT_KEY);
}

async function api(req, env, url) {
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const [resource, id] = parts;
  const method = req.method;

  // Bilder sind öffentlich abrufbar (zufällige, nicht erratbare IDs), damit <img> sie laden kann.
  if (resource === 'images' && id && method === 'GET') {
    const row = await env.DB.prepare('SELECT type, data FROM images WHERE id = ?').bind(id).first();
    if (!row) return new Response('Nicht gefunden', { status: 404 });
    return new Response(new Uint8Array(row.data), {
      headers: { 'content-type': row.type, 'cache-control': 'public, max-age=31536000, immutable' },
    });
  }

  if (!authorized(req, env)) return json({ error: 'Falsches Passwort' }, 401);

  // Passwort prüfen
  if (resource === 'auth' && method === 'GET') return json({ ok: true, protected: !!env.EDIT_KEY });

  // Alle Bereiche lesen
  if (resource === 'state' && !id && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT id, data, updated_at FROM sections').all();
    const sections = {};
    for (const r of results) sections[r.id] = { data: JSON.parse(r.data), v: r.updated_at };
    return json({ sections });
  }

  // Einen Bereich speichern
  if (resource === 'state' && id && method === 'PUT') {
    if (!SECTIONS.includes(id)) return json({ error: 'Unbekannter Bereich' }, 400);
    const text = await req.text();
    if (text.length > MAX_SECTION_BYTES) return json({ error: 'Zu groß' }, 413);
    let data;
    try { data = JSON.parse(text); } catch { return json({ error: 'Kein gültiges JSON' }, 400); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ error: 'Objekt erwartet' }, 400);
    const v = Date.now();
    await env.DB.prepare(
      'INSERT INTO sections (id, data, updated_at) VALUES (?1, ?2, ?3) ' +
      'ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at'
    ).bind(id, JSON.stringify(data), v).run();
    return json({ ok: true, v });
  }

  // Bild hochladen (Rohdaten im Body)
  if (resource === 'images' && !id && method === 'POST') {
    const type = (req.headers.get('content-type') || '').split(';')[0].trim();
    if (!/^image\/(jpeg|png|webp|gif)$/.test(type)) return json({ error: 'Nur Bilder erlaubt' }, 415);
    const buf = await req.arrayBuffer();
    if (buf.byteLength > MAX_IMAGE_BYTES) return json({ error: 'Bild zu groß' }, 413);
    const newId = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO images (id, type, data, created_at) VALUES (?, ?, ?, ?)')
      .bind(newId, type, buf, Date.now()).run();
    return json({ ok: true, id: newId });
  }

  // Bild löschen
  if (resource === 'images' && id && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM images WHERE id = ?').bind(id).run();
    return json({ ok: true });
  }

  return json({ error: 'Nicht gefunden' }, 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    try {
      return await api(req, env, url);
    } catch (err) {
      console.error(err);
      return json({ error: 'Serverfehler' }, 500);
    }
  },
};
