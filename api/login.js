const { send, readJSON } = require("../lib/http");
const { passwordOk, setSession, sameOrigin } = require("../lib/auth");
const { cmd } = require("../lib/store");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, {});
  if (!sameOrigin(req)) return send(res, 403, {});
  if (!process.env.APP_PASSWORD) return send(res, 500, { error: "Manca la password: aggiungi APP_PASSWORD nelle impostazioni di Vercel" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x";
  const key = "agenda:fail:" + ip;
  try {
    const n = Number(await cmd("GET", key)) || 0;
    if (n >= 8) return send(res, 429, { error: "Troppi tentativi: riprova tra 15 minuti" });
  } catch { /* se il database non risponde, il login resta comunque possibile */ }
  let body = null;
  try { body = await readJSON(req); } catch { /* corpo non valido */ }
  if (!body || !passwordOk(body.password || "")) {
    try { await cmd("INCR", key); await cmd("EXPIRE", key, 900); } catch { /* ignora */ }
    return send(res, 401, { error: "Password non corretta" });
  }
  try { await cmd("DEL", key); } catch { /* ignora */ }
  setSession(res);
  send(res, 200, { ok: true });
};
