// Archivio dati: Upstash Redis tramite la sua API web (nessuna libreria necessaria).
function conf() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("Database non collegato: in Vercel apri Storage e collega Upstash Redis al progetto");
  return { url, token };
}

async function cmd(...args) {
  const { url, token } = conf();
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: JSON.stringify(args),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error("Database: " + (j.error || r.status));
  return j.result;
}

async function getJSON(key, def) {
  const v = await cmd("GET", key);
  if (v === null || v === undefined) return def;
  try { return JSON.parse(v); } catch { return def; }
}

async function setJSON(key, val) {
  await cmd("SET", key, JSON.stringify(val));
}

module.exports = { cmd, getJSON, setJSON };
