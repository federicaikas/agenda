const crypto = require("crypto");

const secret = () => process.env.APP_PASSWORD || "";
const token = () => crypto.createHmac("sha256", secret()).update("agenda-session-v1").digest("hex");

function cookies(h) {
  const out = {};
  String(h || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return out;
}

function safeEq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function isAuthed(req) {
  if (!secret()) return false;
  return safeEq(cookies(req.headers.cookie).agenda || "", token());
}

function passwordOk(p) {
  const h = (s) => crypto.createHash("sha256").update(String(s)).digest();
  return secret() !== "" && crypto.timingSafeEqual(h(p), h(secret()));
}

function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}

function setSession(res) {
  res.setHeader("Set-Cookie", `agenda=${token()}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${60 * 60 * 24 * 60}`);
}

module.exports = { isAuthed, passwordOk, sameOrigin, setSession, safeEq };
