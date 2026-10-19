const webpush = require("web-push");
const { cmd, getJSON, setJSON } = require("./store");

async function vapid() {
  let v = await getJSON("agenda:vapid", null);
  if (!v) {
    const k = webpush.generateVAPIDKeys();
    await cmd("SET", "agenda:vapid", JSON.stringify(k), "NX"); // se due richieste arrivano insieme vince la prima
    v = await getJSON("agenda:vapid", k);
  }
  return v;
}

function subject() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return process.env.VAPID_SUBJECT || (host ? "https://" + host : "mailto:agenda@example.com");
}

async function addSubscription(sub) {
  const ok = sub && typeof sub.endpoint === "string" && /^https:\/\//.test(sub.endpoint) && sub.keys && typeof sub.keys.p256dh === "string" && typeof sub.keys.auth === "string";
  if (!ok) throw new Error("iscrizione non valida");
  const subs = (await getJSON("agenda:subs", [])).filter((s) => s.endpoint !== sub.endpoint);
  subs.push({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
  await setJSON("agenda:subs", subs.slice(-20));
}

// Invia a tutti i dispositivi registrati. Restituisce quanti hanno ricevuto.
async function sendAll(payload) {
  const v = await vapid();
  const subs = await getJSON("agenda:subs", []);
  const keep = [];
  let ok = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(s, JSON.stringify(payload), {
        TTL: 3600,
        vapidDetails: { subject: subject(), publicKey: v.publicKey, privateKey: v.privateKey },
      });
      ok++; keep.push(s);
    } catch (e) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) continue; // dispositivo non più valido
      keep.push(s);
    }
  }
  if (keep.length !== subs.length) await setJSON("agenda:subs", keep);
  return { ok, total: subs.length };
}

module.exports = { vapid, addSubscription, sendAll };
